# -*- mode: python -*-
from PyInstaller.building.api import EXE
from PyInstaller.building.build_main import Analysis

block_cipher = None

# Add extra files in the PyInstaller-spec
extra_pyinstaller_files = []
extra_files = [
    "ABOUT.txt",
    "README.mkd",
    "INSTALL.txt",
    "LICENSE.txt",
    "GPL2.txt",
    "GPL3.txt",
    "COPYRIGHT.txt",
    "ISSUES.txt",
    "PKG-INFO",
]

extra_folders = [
    "scripts/",
    "licenses/",
    "locale/",
    "email/",
    "interfaces/Plush/",
    "interfaces/Glitter/",
    "interfaces/wizard/",
    "interfaces/Config/",
    "win/par2/",
    "win/unrar/",
    "win/7zip/",
    "scripts/",
    "icons/",
]

for file_item in extra_files:
    extra_pyinstaller_files.append((file_item, "."))
for folder_item in extra_folders:
    extra_pyinstaller_files.append((folder_item, folder_item))

# Add hidden imports
extra_hiddenimports = ["Cheetah.DummyTransaction"]

pyi_analysis = Analysis(
    ["SABnzbd.py"],
    pathex=["."],
    binaries=[],
    datas=extra_pyinstaller_files,
    hiddenimports=extra_hiddenimports,
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(pyi_analysis.pure, pyi_analysis.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    pyi_analysis.scripts,
    [],
    exclude_binaries=True,
    name="SABnzbd",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    append_pkg=False,
    icon="icons/sabnzbd.ico",
)

coll = COLLECT(
    exe, pyi_analysis.binaries, pyi_analysis.zipfiles, pyi_analysis.datas, strip=False, upx=True, name="SABnzbd"
)

# Build the APP on macOS
if sys.platform == "darwin":
    app = BUNDLE(exe, name="SABnzbd.app", icon=None, bundle_identifier="org.sabnzbd.team")
