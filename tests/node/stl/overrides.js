/**
 * @fileoverview Cura WASM With Overrides Tests
 */

//Imports
const {CuraWASM} = require('../../../dist/cjs');
const {expect} = require('chai');
const {hash, saveFiles} = require('../utils');
const {resolveDefinition} = require('cura-wasm-definitions');
const fs = require('fs');

//Get the file
const file = fs.readFileSync('./demo/benchy.stl').buffer;

//Export
module.exports = () =>
{
  it('will slice the file via transfering the ArrayBuffer with overrides', async () =>
  {
    const slicer = new CuraWASM({
      definition: resolveDefinition('ultimaker2'),
      overrides: [
        {
          key: 'mesh_position_x',
          value: '20'
        }
      ]
    });

    const {gcode, metadata} = await slicer.slice(file, 'stl');

    //Optionally save
    if (saveFiles)
    {
      fs.writeFileSync('./stl-overrides.gcode', new Uint8Array(gcode));
    }

    expect(file.byteLength).to.be.equal(0);

    expect(hash(gcode)).to.equal('6a9c8b059833bfa9149375e2474815de8079d4c2432d5bcfbbea0809cdc578b9');

    expect(metadata).to.eql({
      flavor: 'UltiGCode',
      printTime: 9064,
      material1Usage: 11172,
      material2Usage: 0,
      nozzleSize: 0.4,
      filamentUsage: 11172
    });

    await slicer.destroy();
  });
};