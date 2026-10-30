import hashlib
import importlib.util
import io
from pathlib import Path
import tarfile
import tempfile
import unittest

spec=importlib.util.spec_from_file_location('stager',Path(__file__).with_name('stage-book-media.py'))
stager=importlib.util.module_from_spec(spec);spec.loader.exec_module(stager)


class StageMediaTests(unittest.TestCase):
    def fixture(self,root,payload=b'locked bytes',name=None):
        digest=hashlib.sha256(b'locked bytes').hexdigest();expected='image-'+digest+'.png'
        lock={'media':[{'url':'/tools/lmvideo/media/'+expected,'sha256':digest,'kind':'png','bytes':len(b'locked bytes')}]}
        bundle=root/'bundle.tar.gz'
        with tarfile.open(bundle,'w:gz') as archive:
            member=tarfile.TarInfo(name or expected);member.size=len(payload);archive.addfile(member,io.BytesIO(payload))
        return lock,bundle,expected

    def test_cold_cache_stages_only_verified_bytes(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td);lock,bundle,name=self.fixture(root);cache=root/'cache'
            stager.stage(lock,bundle,cache)
            self.assertEqual((cache/name).read_bytes(),b'locked bytes')
            bundle.unlink();stager.stage(lock,bundle,cache)

    def test_corruption_never_installs_partial_cache(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td);lock,bundle,name=self.fixture(root,payload=b'broken bytes');cache=root/'cache'
            with self.assertRaisesRegex(ValueError,'hash mismatch'): stager.stage(lock,bundle,cache)
            self.assertEqual(list(cache.iterdir()),[])

    def test_bootstrap_can_retain_verified_unreferenced_objects(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td);lock,bundle,name=self.fixture(root)
            payload=b'old poster';digest=hashlib.sha256(payload).hexdigest();old='poster-'+digest+'.png'
            with tarfile.open(bundle,'w:gz') as archive:
                for filename,data in ((name,b'locked bytes'),(old,payload)):
                    member=tarfile.TarInfo(filename);member.size=len(data);archive.addfile(member,io.BytesIO(data))
            cache=root/'cache'
            stager.stage(lock,bundle,cache,allow_retained=True)
            self.assertEqual([p.name for p in cache.iterdir()],[name])
            with self.assertRaisesRegex(ValueError,'unexpected'):
                stager.stage(lock,bundle,root/'strict')

    def test_path_traversal_is_rejected(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td);lock,bundle,name=self.fixture(root,name='../escape');cache=root/'cache'
            with self.assertRaisesRegex(ValueError,'unsafe'): stager.stage(lock,bundle,cache)
            self.assertFalse((root/'escape').exists())


if __name__=='__main__':unittest.main()
