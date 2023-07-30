
const n0d3s = require('./n0d3s');



let buildtool = new n0d3s.BuildTool({

    cli_argv : process.argv.slice(2, process.argv.length)

});

buildtool.build();