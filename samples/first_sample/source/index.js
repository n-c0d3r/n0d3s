
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
.register_page();



$('body')
.appendInner(content.replaceAll('\n', '</br>'));



console.log(data);