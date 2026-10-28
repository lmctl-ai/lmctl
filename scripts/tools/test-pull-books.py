#!/usr/bin/env python3
"""Unit tests for the typed book manifest boundary (no network or render store)."""
import copy
import importlib.util
import unittest
import tempfile
import json
from unittest.mock import patch
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("pull_books", HERE / "pull-books.py")
pull_books = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pull_books)


def manifest():
    return {
        "version": 1, "tool": "lmvideo",
        "repository": "https://github.com/lmctl-ai/lmvideo",
        "title": "Books", "description": "A book", "licence": "MIT",
        "publication_status": "PRIVATE_ACCEPTANCE_CONTENT",
        "groups": [{"id": "examples", "title": "Examples", "summary": "Run them.",
                     "chapters": [{"id": "intro", "title": "Intro", "blocks": [
                         {"kind": "text", "text": "Hello"}]}]}],
        "media": [], "evidence": []
    }


class BookManifestTests(unittest.TestCase):
    def valid(self):
        return manifest()

    def check_bad(self, data, needle):
        with self.assertRaisesRegex(ValueError, needle):
            pull_books.validate(data, "lmctl-ai/lmvideo@deadbeef:examples/books.json")

    def test_valid_minimal_content(self):
        self.assertEqual(pull_books.validate(self.valid(), "origin"), {})

    def test_unknown_presentation_property_rejected(self):
        data = self.valid()
        data["groups"][0]["css_class"] = "hero"
        self.check_bad(data, r"unknown field .*css_class")

    def test_wrong_block_kind_fields_rejected(self):
        data = self.valid()
        data["groups"][0]["chapters"][0]["blocks"][0] = {"kind": "text", "text": "x", "class": "hero"}
        self.check_bad(data, r"unknown field .*class")
        data = self.valid()
        data["groups"][0]["chapters"][0]["blocks"][0] = {"kind": "image", "text": "x"}
        self.check_bad(data, r"wrong fields for block kind")

    def test_duplicate_chapter_and_unsafe_paths(self):
        data = self.valid()
        chapter = copy.deepcopy(data["groups"][0]["chapters"][0])
        data["groups"][0]["chapters"].append(chapter)
        self.check_bad(data, r"duplicate/reserved chapter id")
        data = self.valid()
        data["evidence"] = [{"file": "../secret", "sha256": "a" * 64}]
        self.check_bad(data, r"unsafe|schema")

    def test_media_reference_and_dimensions(self):
        data = self.valid()
        data["media"] = [{"id": "hero", "file": "hero-" + "a" * 64 + ".png", "sha256": "a" * 64,
                           "bytes": 10, "kind": "png", "width": 10, "height": 10}]
        data["groups"][0]["chapters"][0]["blocks"] = [{"kind": "image", "media": "missing", "alt": "A", "caption": "C"}]
        self.check_bad(data, r"PNG|image reference")
        data["groups"][0]["chapters"][0]["blocks"][0]["media"] = "hero"
        data["media"][0].update(width=0, height=-1)
        self.check_bad(data, r"positive|dimensions|PNG")

    def test_video_requires_poster_sources_duration_and_silence(self):
        data = self.valid()
        data["media"] = [
            {"id": "poster", "file": "poster-" + "a" * 64 + ".png", "sha256": "a" * 64, "bytes": 10, "kind": "png", "width": 10, "height": 10},
            {"id": "clip", "file": "clip-" + "b" * 64 + ".mp4", "sha256": "b" * 64, "bytes": 10, "kind": "mp4", "width": 10, "height": 10, "duration_seconds": 2},
        ]
        data["groups"][0]["chapters"][0]["blocks"] = [{"kind": "video", "media": ["clip"], "poster": "poster", "caption": "C", "duration_seconds": 0, "no_audio": False}]
        self.check_bad(data, r"video needs|duration")

    def test_video_poster_must_match_video_size(self):
        data = self.valid()
        data["media"] = [
            {"id": "still", "file": "still-" + "a" * 64 + ".png", "sha256": "a" * 64, "bytes": 10, "kind": "png", "width": 900, "height": 560},
            {"id": "clip", "file": "clip-" + "b" * 64 + ".mp4", "sha256": "b" * 64, "bytes": 10, "kind": "mp4", "width": 1280, "height": 720, "duration_seconds": 2, "no_audio": True},
        ]
        data["groups"][0]["chapters"][0]["blocks"] = [{"kind": "video", "media": ["clip"], "poster": "still", "caption": "C", "duration_seconds": 2, "no_audio": True}]
        self.check_bad(data, r"examples/intro.blocks\[0\]: poster 900x560 must match the video size 1280x720")
        data["media"][0].update(width=1280, height=720)
        pull_books.validate(data, "origin")

    def test_scoreboard_dangling_chapter_and_bad_tier(self):
        data = self.valid()
        data["groups"][0]["scoreboard"] = [{"id": "B01", "chapter": "missing", "title": "X", "tier": 4, "status": "VERIFIED", "seconds": 1}]
        self.check_bad(data, r"invalid scoreboard")


class InstallBooksTests(unittest.TestCase):
    def fixture(self, root):
        target=root/'site';out=root/'out';target.mkdir();out.mkdir()
        for bid in ('examples','cycles'):
            (target/bid).mkdir();(out/bid).mkdir()
            (target/bid/'index.html').write_text('old-'+bid)
            (out/bid/'index.html').write_text('new-'+bid)
        (target/'books-lock.json').write_text(json.dumps({'books':['examples','cycles']}))
        return target,out

    def test_install_and_remove_stale_owned_book(self):
        with tempfile.TemporaryDirectory() as td:
            target,out=self.fixture(Path(td))
            import shutil
            shutil.rmtree(out/'cycles')
            pull_books.install_books(out,target,['examples'],{'books':['examples']})
            self.assertEqual((target/'examples/index.html').read_text(),'new-examples')
            self.assertFalse((target/'cycles').exists())

    def test_second_book_failure_restores_all_books_and_lock(self):
        with tempfile.TemporaryDirectory() as td:
            target,out=self.fixture(Path(td));before=(target/'books-lock.json').read_bytes()
            original=Path.rename
            def rename(path,destination):
                if path.parent.name=='.books-import-new' and path.name=='examples':
                    raise OSError('injected second-book install failure')
                return original(path,destination)
            with patch.object(Path,'rename',rename):
                with self.assertRaisesRegex(OSError,'injected'):
                    pull_books.install_books(out,target,['examples','cycles'],{'books':['examples','cycles']})
            for bid in ('examples','cycles'):
                self.assertEqual((target/bid/'index.html').read_text(),'old-'+bid)
            self.assertEqual((target/'books-lock.json').read_bytes(),before)
            self.assertFalse((target/'.books-import-old').exists())

    def test_authored_book_is_never_overwritten(self):
        with tempfile.TemporaryDirectory() as td:
            target,out=self.fixture(Path(td));(target/'books-lock.json').unlink()
            with self.assertRaisesRegex(ValueError,'unowned'):
                pull_books.install_books(out,target,['examples','cycles'],{'books':['examples','cycles']})
            self.assertEqual((target/'examples/index.html').read_text(),'old-examples')


if __name__ == "__main__":
    unittest.main()
