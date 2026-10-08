from PyInstaller.utils.hooks import collect_submodules

analysis = Analysis(['app/__main__.py'], pathex=[SPECPATH], hiddenimports=collect_submodules('uvicorn'), excludes=['tkinter'])
pyz = PYZ(analysis.pure)
exe = EXE(pyz, analysis.scripts, [], exclude_binaries=True, name='novel-studio-backend', console=True, upx=False)
coll = COLLECT(exe, analysis.binaries, analysis.datas, name='novel-studio-backend', upx=False)
