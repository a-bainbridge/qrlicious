let foods = [1, 2, 3]
foods[0] = { name: "choccy almond", calories: 10 };
foods[1] = { name: "shrimp chimp", calories: 500 };
foods[2] = { name: "what", calories: 75};
make=()=>{
    foods.push({name: "more shrimp chips", calories: 500})
    console.log(foods)
    d.innerHTML=''
    generate()
}
function rem(i,contain) {
return function() {
    foods.splice(i,1)
    console.log(foods)
    d.innerHTML=''
    generate()
};
}
let b
let d = document.getElementById("top list")
let contain
function generate(){
    for (let x = 0; x < foods.length;x++) {
        contain=(document.createElement("div"))
        contain.setAttribute("id",x.toString())
        contain.appendChild(document.createElement("p").appendChild(document.createTextNode(foods[x].name+" ")))
        b=document.createElement("button")
        b.appendChild(document.createTextNode("X"))
        b.addEventListener("click", rem(x, contain), false)
        contain.appendChild(b)
        d.appendChild(contain)
    }
}
generate()