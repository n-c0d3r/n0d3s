
module.use({

    n0d3s : "./n0d3s",

})
.use([

    "./styles/common"

])
.register_page();



$('body')
.appendInner("hello world");