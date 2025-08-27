import React, { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "./Home.css";

function Home({ token, setToken }) {
  const [message, setMessage] = useState("No hay notificaciones");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log(decoded);
        setName(decoded.name || decoded.Name || "Nombre no disponible");
        setRole(decoded.role || decoded.Role || "Rol no disponible");
      } catch (e) {
        console.error("❌ Error al decodificar el token:", e);
      }
    }
  }, [token]);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:44381/hub/notifications", {
        accessTokenFactory: () => token,
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connection.on("ReceiveNotification", (msg) => {
      console.log("📩 Notificación recibida:", msg);
      setMessage(msg);
    });

    connection
      .start()
      .then(() => console.log("✅ Conectado al hub"))
      .catch((err) => console.error("❌ Error de conexión al hub", err));

    return () => {
      connection.stop();
    };
  }, [token]);

  // Probar envío manual
  const sendNotification = async () => {
    const targetUserId = prompt("¿ID de usuario a notificar?");
    await axios.post(
      `https://localhost:44381/api/notifications/send?targetUserId=${targetUserId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  };

  const clearNotification = () => {
    setMessage("No hay notificaciones");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <div className="container">
      <h2>Home</h2>
      <p><strong>Nombre:</strong> {name}</p>
      <p><strong>Rol:</strong> {role}</p>
      <p><strong>Mensaje recibido:</strong> {message}</p>
      <button onClick={sendNotification}>Enviar notificación a otro usuario</button>
      <button onClick={clearNotification}>Limpiar notificación</button>
      <button onClick={handleLogout}>Cerrar sesión</button>
    </div>
  );
}

export default Home;
