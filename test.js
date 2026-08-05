fetch("http://localhost:3000/api/discount/validate", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        code: "MAJORAT10"
    })
})
.then(async r => {
    console.log("STATUS:", r.status);
    console.log(await r.text());
})
.catch(console.error);