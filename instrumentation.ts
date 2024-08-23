export function register() {
    fetch('http://localhost:3000/api/start').then((res) => res.json()).then((data) => {
        if (!data?.success) {
            console.error("Cannot instrumentate app")
        }
    })
}