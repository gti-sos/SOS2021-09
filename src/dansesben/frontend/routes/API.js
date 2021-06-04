const BASE_URL = "/api/v2/performances-by-degrees-us/";

export const getAllRecords = async function(){
    let res = await fetch(BASE_URL);
    return await res.json();
};

export const searchRecords = function(options){
    let params = [];
    let paramsURL = "";
    for(let value in options){
        if(value !== "page" && options[value] !== ""){
            params.push(value + "=" + options[value]);
        }
    }

    if("page" in options){
        params.push("offset=" + (parseInt(options["page"])-1) * parseInt(options["limit"]));
    }

    if(params.length > 0){
        paramsURL = "?" + params.join("&");
    }

    return fetch(BASE_URL + paramsURL).then(response => response.json());
};

export const deleteRecord = async function(element){
    let res = await fetch(BASE_URL + element.center + "/" + element.year + "/" + element["field-of-knowledge"], {"method": "DELETE"});

    if(res.status === 200){
        return {text: "Eliminado " + element.center + "/" + element.year + "/" + element["field-of-knowledge"] + " correctamente", color: "success"};
    }else if(res.status === 404){
        return {text: "Elemento " + element.center + "/" + element.year + "/" + element["field-of-knowledge"] + " no existe", color: "warning"};
    }else{
        return {text: "Error interno al intentar borrar " + element.center + "/" + element.year + "/" + element["field-of-knowledge"], color: "danger"};
    }
}

export const deleteAllRecords = async function(){
    let res = await fetch(BASE_URL, {"method": "DELETE"});

    if(res.status === 200){
        return {text: "Todos los elementos han sido eliminados", color: "success"};
    }else{
        return {text: "Error interno al intentar borrar todos los elementos", color: "danger"};
    }
}

export const addRecord = async function(element){
    let res = await fetch(BASE_URL, {"method": "POST", headers: {'Content-Type': 'application/json'}, body: JSON.stringify(element)});

    if(res.status === 201){
        return {text: "Elemento correctamente añadido", color: "success"};
    }
    else if(res.status === 400){
        return {text: "Elemento inválido, revise que los valores sean válidos", color: "warning"};
    }
    else if(res.status === 409){
        return {text: "El elemento ya existe", color: "warning"};
    }
    else{
        return {text: "Error interno al intentar añadir el elemento", color: "danger"};
    }
}