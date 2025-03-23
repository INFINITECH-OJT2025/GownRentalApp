// frontend/utils/api.js

export async function getCurrentUser(token) {
    const res = await fetch("http://localhost:8000/api/user", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await res.json();
    const user = data.user || data;

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
    };
}

// Get first admin (for customers to chat with)
export async function getAdmin() {
    const res = await fetch("http://localhost:8000/api/admins");
    const admins = await res.json();
    return admins[0];
}

// ✅ NEW: Get current customer (if logged-in user is a customer)
export async function getCurrentCustomer(token) {
    const user = await getCurrentUser(token);
    if (user.role === "customer") {
        return user;
    } else {
        return null;
    }
}
  
  export async function getCustomersLoggedInToday(token) {
    const res = await fetch("http://localhost:8000/api/customers-today", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await res.json();
    return data.customers || [];
}


