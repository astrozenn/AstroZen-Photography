import "dotenv/config";
const response = await fetch("http://localhost:3000/api/discount/validate", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        code: "MAJORAT10",
        email: "test@gmail.com"
    })
});

console.log("STATUS:", response.status);

const data = await response.json();

console.log(JSON.stringify(data, null, 2));