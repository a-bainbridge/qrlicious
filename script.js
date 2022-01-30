let yea=(id)=>document.getElementById(id)
let foods = []
let people = []
let days
let rando
let m
let n
console.log(foods)
clear=(root)=> {
    for(j = 0; j < root.children.length; j++) {
        yea("b" + j).removeEventListener("click", yea("b" + j).onclick)
        root.removeChild(root.children[0])
    }
}
make=()=>{
    foods.push({name: yea("fn").value, caloriesPer: yea("cal").value})
    clear(df)
    df.innerHTML=''
    generate(foods, df)

}
makePerson=()=>{
    people.push({name: yea("n").value, age: yea("age").value, weight: yea("wgt").value})
    clear(dp)
    dp.innerHTML=''
    generate(people, dp)
}
// penultimateScreen=()=>{

//     
//     yea("ps").style.display="block"
// }
endScreen=()=>{
    for (let i=0;i<people.length;i++){
    people[i].bmr=1.3*((10*people[i].weight)+(6.25+175)-(5*people[i].age)+5)
    }
    yea("people").style.display="none"
    yea("es").style.display="block"
    ro1=yea("tr1")
    for (let z=0;z<people.length;z++){
        the=document.createElement("th")
        the.innerHTML=people[z].name
        ro1.appendChild(the)
    }
    tabl=yea("tb")
    for (let r=0;r<7;r++){
        ro=document.createElement("tr")
        ro.innerHTML="<td>"+(r+1).toString()+"</td>"
        rando=Math.random()
        m=Math.round(rando*foods.length%(foods.length-1))
        n=Math.round(((10*rando-Math.floor(10*rando))*foods.length)%(foods.length-1))
        if (m==n){
            n=(n+1)%(foods.length-1)
        }
        for (let z=0;z<people.length;z++){
            console.log(m)
            console.log(n)
            ro.innerHTML+=`<td>${foods[m].name}: ${(people[z].bmr/foods[m].caloriesPer).toPrecision(4)} servings \n\n ${foods[n].name}: ${(people[z].bmr/foods[m].caloriesPer).toPrecision(4)} servings</td>`
        }
        tabl.innerHTML+=ro.outerHTML
    }
}
switchVisibility=()=>{
    df.innerHTML=''
    yea("people").style.display="block"
    yea("foods").style.display="none"
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
let df = yea("tl")
let dp = yea("tlp")
let but_done = yea("foods_done")
let peo_done = yea("people_done")
let contain
let pe
function generate(listeds, root){
    but_done.disabled = foods.length<2
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

let form = yea("form");
function handleForm(event) { event.preventDefault(); make();} 
form.addEventListener('submit', handleForm);
let form1 = yea("form1");
function handleForm1(event) { event.preventDefault(); makePerson();} 
form1.addEventListener('submit', handleForm1);
