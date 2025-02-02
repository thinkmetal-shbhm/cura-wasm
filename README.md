# Cura WASM

[![npm](https://img.shields.io/npm/v/cura-wasm)](https://npmjs.com/package/cura-wasm)
[![tests](https://img.shields.io/github/workflow/status/Cloud-CNC/cura-wasm/Tests?label=tests)](https://github.com/Cloud-CNC/cura-wasm/actions)
[![Maintainability](https://api.codeclimate.com/v1/badges/67a492b070316bea1936/maintainability)](https://codeclimate.com/github/Cloud-CNC/cura-wasm/maintainability)
[![last commit](https://img.shields.io/github/last-commit/Cloud-CNC/cura-wasm)](https://github.com/Cloud-CNC/cura-wasm/commits/master)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FCloud-CNC%2Fcura-wasm.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FCloud-CNC%2Fcura-wasm?ref=badge_shield)

[Cura Engine](https://github.com/ultimaker/curaengine) powered by [Web Assembly (WASM)](https://webassembly.org)

## Features

- Supports multiple input file formats including 3MF, AMF, PLY, OBJ, and STL via the [Unified 3D Loader](https://github.com/cloud-cnc/unified-3d-loader)
- Written in modern TypeScript
- Uses Rollup for JS/TS compilation
- Uses Docker for C++ compilation (Enhanced reproducibility)
- Ships with **everything** already compiled
- Works in the browser and on NodeJS
- Supports custom Cura Engine launch command
- Provides print metadata (Filament usage, estimated time, etc.)
- Thoroughly commented

## Install

```console
npm i cura-wasm-tkml
```

## Usage

### Exports

Cura WASM ships with both ES6 and CJS exports. The ES6 version is built with browsers in mind and likely won't work on NodeJS; the CJS version is built with NodeJS in mind and almost certainly won't work on browsers due to lacking standard modules.

### Definitions

Unless you have your own 3D printer definition (That isn't included with Cura), you should use [`cura-wasm-definitions`](https://github.com/cloud-cnc/cura-wasm-definitions) for 3D printer defintions.

### Examples

- Basic Benchy + Ultimaker 2 example

```Javascript
import {CuraWASM} from 'cura-wasm-tkml';
import {resolveDefinition} from 'cura-wasm-definitions';

const main = async () =>
{
  //Create a new slicer
  const slicer = new CuraWASM({
    /**
     * Specify Cura Engine launch arguments (Identical to desktop Cura Engine).
     *
     * If you find that "-s" overrides aren't taking effect, make sure that you
     * order your arguments correctly.
     *
     * NOTE: You CANNOT specify both this setting and overrides!
     */
    command: 'slice -j definitions/printer.def.json -o Model.gcode -s layer_height=0.06 -l Model.stl',

    /*
     * The 3D printer definition to slice for (See the cura-wasm-definitions
     * repository or https://github.com/cloud-cnc/cura-wasm-definitions
     * for a list of built-in definitions)
     */
    definition: resolveDefinition('ultimaker2'),

    /*
     * Overrides for the current 3D printer definition (Passed to Cura Engine
     * with the -s CLI argument)
     *
     * NOTE: You CANNOT specify both this setting and launch arguments!
     */
    overrides: [
      {
        /*
         * The scope of the setting. (Passed to Cura Engine with a leading
         * hyphen before the corresponding -s argument)
         */
        scope: 'e0',

        //The override's key/name
        key: 'mesh_position_x',

        //The override's value
        value: -10
      }
    ],

    /**
     * Wether or not to transfer the input STL ArrayBuffer to the worker thread
     * (Prevents duplicating large amounts of memory but empties the ArrayBuffer
     * on the main thread preventing other code from using the ArrayBuffer)
     */
    transfer: true,

    /*
     * Wether to enable verbose logging (Useful for debugging; allows Cura
     * Engine to directly log to the console)
     */
    verbose: true
  });

  //Load your STL as an ArrayBuffer
  const res = await fetch('/demo/benchy.stl');
  const stl = await res.arrayBuffer();

  //Progress logger (Ranges from 0 to 100)
  slicer.on('progress', percent =>
  {
    console.log(`Progress: ${percent}%`);
  });

  //Slice (This can take multiple minutes to resolve!)
  const {gcode, metadata} = await slicer.slice(stl, 'stl');

  //Do something with the GCODE (ArrayBuffer) and metadata (Object)

  //Dispose (Reccomended but not necessary to call/intended for SPAs)
  slicer.dispose();
}
main();
```

- Multiple browser examples can be found in the [`demo`](demo) and [`tests/web` directory](tests/web) (Which is used for browser tests).
- Multiple NodeJS examples can be found in the [`tests/node` directory](tests/node).

### Performance

The performance is decent but not great. If you're running NodeJS, consider using native Cura Engine instead unless you want the isolation from the WASM VM.

_Note: Cura Engine uses OpenMP for multithreading, however, Emscripten doesn't support OpenMP._

| Name                        | Slice Time |
| --------------------------- | ---------- |
| `NodeJS V15.2.0`            | `7782ms`   |
| `Chrome 86.0.4240.193`      | `6615ms`   |
| `Firefox 82.0.3`            | `6581ms`   |
| `Native Cura Engine V4.6.1` | `2259ms`   |

[![Slicing Time](assets/chart.png)](assets/chart.png)

_Note: All runtimes were benchmarked 6 times then averaged. The benchmarking computer ran Windows 10 Pro 20H2 (19042.610), with a Ryzen 7 3700X, 32GB DDR4-3600MHZ (CL16), NVMe Gen 4 SSD._

### Low level API

You can directly import [`CuraEngine.js`](./src/CuraEngine.js) from the `src` directory. It's directly built by Emscripten but be warned: it will choke up the calling thread hence the need for Threads JS.

## FAQ

### How does it work?

Cura WASM uses [emscripten](https://emscripten.org) to compile [Cura Engine](https://github.com/ultimaker/curaengine) to [Web Assembly](https://webassembly.org).

Depending on the input file format, Cura WASM uses the [Unified 3D Loader](https://github.com/cloud-cnc/unified-3d-loader) to convert any non-STL file to an STL file. Emscripten provides a virtual filesystem with which Cura WASM loads the STL file into as well as the 3D printer definitions. Cura WASM includes a very small modification to Cura Engine which makes it call the global worker progress function alerting Cura WASM when the progress updates so it can pass it along to the API consumer.

### Hasn't this been done before?

Yes, this is by no means the first time someone has compiled Cura Engine to run in the browser. Previous projects include [gyf304/cura-emscripten](https://github.com/gyf304/cura-emscripten), [nelsonsilva/CuraEngine-em](https://github.com/nelsonsilva/CuraEngine-em), [Skeen/CuraJS-Engine](https://github.com/Skeen/CuraJS-Engine), and possibly more. However, none of these are maintained and only one (CuraJS) is meant to be used as a library - not a stand-alone application.

### Can I contribute?

Yes. If you're looking for something specific to help with, I'd greatly appreciate any help with making Cura Engine run faster, tightening the JS/TS <---> C++ coupling (eg: improved Cura Engine error reporting), and improving the JS/TS API.

### What's the license?

Cura WASM relies on Cura Engine [which uses AGPL3+](https://github.com/Ultimaker/CuraEngine/blob/master/LICENSE) and Cura which [which uses LGPL3+](https://github.com/Ultimaker/Cura/blob/master/LICENSE) hence the AGLP3+/LGPL3+ license requirement. With that said, the AGLP3+ license **only** applies to [CuraEngine.js](./src/CuraEngine.js), the LGPL3+ license **only** applies to all files in the [src](./src/definitions) directory excluding [index.ts](./src/definitions/index.ts). All other files use the MIT licensed.

## License Obligations

### Upstream Modifications

Minor modifications to Cura Engine to get it to compile and for progress logging (See [`docker/CuraEngine.patch`](./docker/CuraEngine.patch) for exact modifications). All definitions are used verbatim.

### Source

The sources are located at [github.com/ultimaker/curaengine](https://github.com/ultimaker/curaengine), [github.com/ultimaker/cura](https://github.com/ultimaker/cura), [github.com/cloud-cnc/cura-wasm-definitions](https://github.com/cloud-cnc/cura-wasm-definitions).

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FCloud-CNC%2Fcura-wasm.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2FCloud-CNC%2Fcura-wasm?ref=badge_large)
