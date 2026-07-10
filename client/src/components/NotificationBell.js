import { useEffect, useRef, useState } from "react";
import * as notificationService from "../services/notificationService";
import { getSocket } from "../services/socket";
import "../styles/notificationBell.css";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { notifications: list, unreadCount: count } = await notificationService.fetchNotifications();
        setNotifications(list);
        setUnreadCount(count);
      } catch {
        // silent - notifications are non-critical
      }
    };
    load();

    const socket = getSocket();
    const handleNew = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((c) => c + 1);
    };
    socket.on("notification:new", handleNew);
    return () => socket.off("notification:new", handleNew);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = async () => {
    setOpen((o) => !o);
    if (unreadCount > 0) {
      await notificationService.markAllNotificationsRead().catch(() => {});
      setUnreadCount(0);
    }
  };

  return (
    <div className="notif" ref={panelRef}>
      <button className="notif__trigger" onClick={handleOpen} aria-label="Notifications">
        🔔
        {unreadCount > 0 && <span className="notif__dot">{unreadCount}</span>}
      </button>
      {open && (
        <div className="notif__panel">
          <div className="notif__header">Notifications</div>
          {notifications.length === 0 ? (
            <div className="notif__empty">You're all caught up.</div>
          ) : (
            <ul className="notif__list">
              {notifications.slice(0, 8).map((n) => (
                <li key={n._id} className="notif__item">
                  <span className={`notif__badge notif__badge--${n.type}`} />
                  <div>
                    <p className="notif__title">{n.title}</p>
                    <p className="notif__message">{n.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
