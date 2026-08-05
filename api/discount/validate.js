export default function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const body = req.body || {};

    const code = String(body.code || "").trim().toUpperCase();


    if (!code) {
        return res.status(400).json({
            valid:false,
            error:"Lipsește codul"
        });
    }


    const discounts = {
        MAJORAT10: {
            code: "MAJORAT10",
            percent: 10,
            active: true
        },
        MAJORAT20: {
            code: "MAJORAT20",
            percent: 20,
            active: true
        },
        BRILA25: {
            code: "BRILA25",
            percent: 25,
            active: true
        }
    };


    const discount = discounts[code];


    if (!discount || !discount.active) {
        return res.status(404).json({
            valid:false,
            error:"Cod invalid"
        });
    }


    return res.json({
        valid:true,
        code:discount.code,
        percent:discount.percent
    });

}