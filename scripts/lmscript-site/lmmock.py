"""Fetch a checksum-pinned raw release; reverify cache on every use."""
import hashlib
import json
import os
from pathlib import Path
import platform
import tempfile
import urllib.request


def host_path():
    override = os.environ.get('LMMOCK_BIN')
    if override:
        return str(Path(override).absolute())
    lock = json.loads(Path(__file__).with_name('lmmock.lock').read_text())
    os_name = {'Linux': 'linux', 'Darwin': 'macos'}.get(platform.system())
    arch = {'x86_64': 'x64', 'AMD64': 'x64', 'arm64': 'arm64', 'aarch64': 'arm64'}.get(platform.machine())
    asset = f'lmmock-{os_name}-{arch}'
    if asset not in lock['sha256']:
        raise RuntimeError(f'Unsupported lmmock platform: {platform.system()} {platform.machine()}')
    cache = Path(os.environ.get('XDG_CACHE_HOME', Path.home() / '.cache')) / 'lmctl-site' / lock['version']
    cache.mkdir(parents=True, exist_ok=True)
    target = cache / asset
    def valid(path):
        return hashlib.sha256(path.read_bytes()).hexdigest() == lock['sha256'][asset]
    if not target.is_file() or not valid(target):
        url = f'https://github.com/lmctl-ai/lmmock/releases/download/{lock["version"]}/{asset}'
        with tempfile.NamedTemporaryFile(dir=cache, delete=False) as file:
            temp = Path(file.name)
        try:
            with urllib.request.urlopen(url, timeout=60) as response, temp.open('wb') as output:
                import shutil
                shutil.copyfileobj(response, output)
            if not valid(temp):
                raise RuntimeError('lmmock release checksum mismatch')
            temp.chmod(0o755)
            temp.replace(target)
        finally:
            temp.unlink(missing_ok=True)
    target.chmod(0o755)
    return str(target)

if __name__ == '__main__':
    print(host_path())
