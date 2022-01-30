let foods = []
let people = []
let days
let rando
let m
let n
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
penultimateScreen=()=>{
    for (let i=0;i<people.length;i++){
        if (people[i].gender=="Male") {people[i].bmr=1.3*((10*people[i].weight)+(6.25+175)-(5*people[i].age)+5)}
        else {people[i].bmr=1.3*((10*people[i].weight)+(6.25+63)-(5*people[i].age)-161)}
    }
    document.getElementById("people").style.display="none"
    document.getElementById("ps").style.display="block"
}
endScreen=()=>{
    document.getElementById("ps").style.display="none"
    document.getElementById("es").style.display="block"
    ro1=document.getElementById("tr1")
    for (let z=0;z<people.length;z++){
        the=document.createElement("th")
        the.innerHTML=people[z].name
        ro1.appendChild(the)
    }
    tabl=document.getElementById("the only table lmao")
    for (let r=0;r<days;r++){
        ro=document.createElement("tr")
        ro.innerHTML="<td>"+(r+1).toString()+"</td>"
        rando=Math.random()
        m=Math.round(rando*foods.length%(foods.length-1))
        n=Math.round(((10*rando-Math.floor(10*rando))*foods.length)%(foods.length-1))
        if (m==n){
            n=(n+1)%(foods.length-1)
        }
        for (let z=1;z<people.length+1;z++){
            console.log(m)
            console.log(n)
            ro.innerHTML+=`<td>${foods[m].name}: ${(people[z-1].bmr/2000).toPrecision(4)} serving \n\n ${foods[n].name}: ${(people[z-1].bmr/2000).toPrecision(4)} serving</td>`
        }
        tabl.innerHTML+=ro.outerHTML
    }
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
let pe
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
let form2 = document.getElementById("form2");
function handleForm2(event) { event.preventDefault(); days=document.getElementById("days").value; endScreen()} 
form2.addEventListener('submit', handleForm2);
