
module.use([

    "n0d3s"

])
.register_page(
    `Static: Hello World 1`, 
    `Static: Hello World 3`
);



$('body').innerHTML += "<br/> Dynamic: Hello World 2 <br/>";