// frontend/utils/api.js

export async function getCurrentUser(token) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
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

export async function getAdmin() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admins`);
      if (!res.ok) throw new Error("Admin fetch failed");
      const admins = await res.json();
      return admins[0];
    } catch (err) {
      console.error("❌ getAdmin failed:", err);
      return null;
    }
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
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customers-today`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await res.json();
    return data.customers || [];
}


