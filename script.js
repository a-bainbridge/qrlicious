let foods = []
let people = []
console.log(foods)
clear=(root)=> {
    for(j = 0; j < root.children.length; j++) {
        document.getElementById("b" + j).removeEventListener("click", document.getElementById("b" + j).onclick)
        root.removeChild(root.children[0])
    }
}
make=()=>{
    foods.push({name: document.getElementById("fn").value, caloriesPer: document.getElementById("cal").value, servingSize: document.getElementById("ss").value})
    clear(df)
    df.innerHTML=''
    generate(foods, df)

}
makePerson=()=>{
    people.push({name: document.getElementById("n").value, age: document.getElementById("age").value, weight: document.getElementById("wgt").value, gender: document.getElementById("gender").value})
    clear(dp)
    dp.innerHTML=''
    generate(people, dp)
}
endScreen=()=>{
    document.getElementById("people").style.display="none"
    document.getElementById("es").style.display="block"
}
switchVisibility=()=>{
    df.innerHTML=''
    document.getElementById("people").style.display="block"
    document.getElementById("foods").style.display="none"
    generate(people, dp)
}
function rem(i,contain,listeds,root) {
return function() {

    clear(root)
    listeds.splice(i,1)
    //df.outerHTML=df.outerHTML
    root.innerHTML=''
    //dp.outerHTML=dp.outerHTML
    generate(listeds,root)
};
}
let b
let df = document.getElementById("top_list")
let dp = document.getElementById("top_list_people")
let but_done = document.getElementById("foods_done")
let peo_done = document.getElementById("people_done")
let contain
function generate(listeds, root){
    but_done.disabled = foods.length==0
    peo_done.disabled = people.length==0
    for (let x = 0; x < listeds.length;x++) {
        contain=document.createElement("div")
        contain.setAttribute("id",x.toString())
        pe=document.createElement("p")
        pe.appendChild(document.createTextNode(listeds[x].name+" "))
        pe.className="list items"
        contain.appendChild(pe)
        b=document.createElement("button")
        b.className="delete"
        b.id = "b" + x
        b.appendChild(document.createTextNode("X"))
        b.onclick = rem(x, contain, listeds, root)
        // b.addEventListener("click", rem(x, contain,listeds,root), false)
        contain.appendChild(b)
        root.appendChild(contain)
    }
}
generate(foods, df)

let form = document.getElementById("form");
function handleForm(event) { event.preventDefault(); make();} 
form.addEventListener('submit', handleForm);
let form1 = document.getElementById("form1");
function handleForm1(event) { event.preventDefault(); makePerson();} 
form1.addEventListener('submit', handleForm1);