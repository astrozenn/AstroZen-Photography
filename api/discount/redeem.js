import fs from "fs";
import path from "path";


export default function handler(req,res){

    if(req.method !== "POST"){
        return res.status(405).json({
            error:"Method not allowed"
        });
    }


    const body = req.body || {};

    const code = String(body.code || "").trim().toUpperCase();
    const email = String(body.email || "").trim().toLowerCase();


    if(!code || !email){
        return res.status(400).json({
            error:"Lipsesc datele"
        });
    }


    const filePath = path.join(
        process.cwd(),
        "discount-redemptions.json"
    );


    let redemptions=[];


    if(fs.existsSync(filePath)){
        redemptions = JSON.parse(
            fs.readFileSync(filePath,"utf8")
        );
    }


    const exists = redemptions.some(
        item => item.code === code && item.email === email
    );


    if(exists){
        return res.status(409).json({
            error:"Cod de discount deja folosit."
        });
    }


    redemptions.push({
        code,
        email,
        date:new Date().toISOString()
    });


    fs.writeFileSync(
        filePath,
        JSON.stringify(redemptions,null,2)
    );


    res.json({
        success:true
    });

}