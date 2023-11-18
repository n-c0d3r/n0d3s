
module.use({

    n0d3s : "./n0d3s",

})
.use([

    "./**",

])
.text({

    content: "content",
    
})
.json({

    data: "data",
    
})
.exe(()=>{

    console.log(module.path_query("./**"));

    var new_module = module.create_virtual_module(`
    
        module;

        console.log("hello world");
    
    `);

})
.register_page();



$('body')
.appendInner(content.replaceAll('\n', '</br>'));



console.log(data);