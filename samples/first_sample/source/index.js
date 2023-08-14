
module.use({

    n0d3s : "./n0d3s",

})
.use([

    "./**",

])
.text({

    content: "content.txt",
    
})
.json({

    data: "data.json",
    
})
.register_page();



$('body')
.appendInner(content.replaceAll('\n', '</br>'));



console.log(data);