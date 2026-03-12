async function testRegister() {
    try {
        console.log("Sending registration request to http://localhost:5000/api/auth/register ...");
        const res = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: "Direct Test Node",
                email: "directnode" + Date.now() + "@example.com",
                password: "Password123", // Has digit and >= 8 chars
                role: "citizen"
            })
        });
        const data = await res.json();
        if (res.ok) {
            console.log("SUCCESS:", data);
        } else {
            console.log("FAILURE:", res.status, data);
        }
    } catch (err) {
        console.error("FETCH ERROR:", err.message);
    }
}

testRegister();
