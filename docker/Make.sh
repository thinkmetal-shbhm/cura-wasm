#Build Cura Engine for WASM

#Install EMSDK
git clone https://github.com/emscripten-core/emsdk.git

cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
cd ../

#Clone CuraEngine
git clone https://github.com/Ultimaker/CuraEngine.git
cd CuraEngine

#Apply the patch
git checkout d509e7e14975e55a02667b4857640c0fe7ee069f
git apply --ignore-space-change ../CuraEngine.patch

#Build CuraEngine with emscripten
mkdir build
cd build
export EMMAKEN_CFLAGS="-O2 -s ALLOW_MEMORY_GROWTH=1 -s EXPORT_ES6=1 -s EXPORT_NAME='CuraEngine' -s EXTRA_EXPORTED_RUNTIME_METHODS='[\"callMain\", \"FS\"]' -s INVOKE_RUN=0 -s MODULARIZE=1 -s SINGLE_FILE=1 -s USE_ES6_IMPORT_META=0"
emcmake cmake -DENABLE_ARCUS=OFF -DCMAKE_BUILD_TYPE=Release -DBUILD_TESTS=OFF ..
emmake make
cd ../../

#Generate patch
#cd CuraEngine
#git diff > ../CuraEngine.patch

#Get current revision
#git rev-parse HEAD