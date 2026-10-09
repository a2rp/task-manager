import { useEffect, useMemo, useRef, useState } from "react";
import { FiCalendar, FiCheck, FiEdit2, FiPlus, FiSearch, FiTrash2, FiX } from "react-icons/fi";
import styles from "./styles.module.css";
const key = "task-manager-items";
const today = new Date().toISOString().slice(0, 10);
const seed = [{ id: "a", title: "Send the project outline", due: today, priority: "High", category: "Work", done: false }, { id: "b", title: "Book a dentist appointment", due: today, priority: "Medium", category: "Personal", done: false }, { id: "c", title: "Review the reading notes", due: today, priority: "Low", category: "Learning", done: true }, { id: "d", title: "Prepare next week's plan", due: today, priority: "Medium", category: "Work", done: false }, { id: "e", title: "Pay the electricity bill", due: today, priority: "High", category: "Personal", done: false }];
const load = () => { try { const data = JSON.parse(localStorage.getItem(key)); return Array.isArray(data) ? data : seed; } catch { return seed; } };
const blank = { title: "", due: today, priority: "Medium", category: "Work" };
const TaskManager = () => {
    const [tasks, setTasks] = useState(load);
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState("All tasks");
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(blank);
    const [editing, setEditing] = useState(null);
    const [removing, setRemoving] = useState(null);
    const cancelRef = useRef(null);
    useEffect(() => localStorage.setItem(key, JSON.stringify(tasks)), [tasks]);
    useEffect(() => {
        if (!removing) return undefined;
        cancelRef.current?.focus();
        const onKey = (event) => { if (event.key === "Escape") setRemoving(null); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [removing]);
    const open = tasks.filter((task) => !task.done);
    const complete = tasks.filter((task) => task.done);
    const shown = useMemo(() => open.filter((task) => {
        const matches = filter === "All tasks" || (filter === "Today" ? task.due === today : filter === "High priority" ? task.priority === "High" : task.category === filter);
        return matches && (task.title + " " + task.category + " " + task.priority).toLowerCase().includes(query.toLowerCase());
    }).sort((a, b) => a.due.localeCompare(b.due)), [open, filter, query]);
    const save = (event) => { event.preventDefault(); if (!form.title.trim()) return; if (editing) setTasks((items) => items.map((task) => task.id === editing ? { ...task, ...form, title: form.title.trim() } : task)); else setTasks((items) => [...items, { ...form, id: crypto.randomUUID(), title: form.title.trim(), done: false }]); setForm(blank); setEditing(null); setShowForm(false); };
    const edit = (task) => { setForm({ title: task.title, due: task.due, priority: task.priority, category: task.category }); setEditing(task.id); setShowForm(true); };
    const toggle = (id) => setTasks((items) => items.map((task) => task.id === id ? { ...task, done: !task.done } : task));
    const dateLabel = (value) => value === today ? "Today" : new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value + "T12:00:00"));
    const filters = ["All tasks", "Today", "High priority", "Work", "Personal", "Learning"];
    return <section className={styles.taskPage} id="inbox">
        <header className={styles.heading}><div><p className={styles.label}>A clear place to begin</p><h1>Work from one list.</h1><p>Catch the task, choose its priority, and move on.</p></div><button className={styles.addButton} onClick={() => { setEditing(null); setForm(blank); setShowForm(!showForm); }}><FiPlus />New task</button></header>
        <div className={styles.summary}><div><span>Inbox</span><strong>{open.length}</strong></div><div><span>Due today</span><strong>{open.filter((task) => task.due === today).length}</strong></div><div><span>Completed</span><strong>{complete.length}</strong></div><div className={styles.search}><FiSearch /><input placeholder="Search tasks" aria-label="Search tasks" value={query} onChange={(event) => setQuery(event.target.value)} /></div></div>
        {showForm && <form className={styles.form} onSubmit={save}><div className={styles.formHead}><strong>{editing ? "Edit task" : "Add a task"}</strong><button type="button" onClick={() => setShowForm(false)} aria-label="Close form"><FiX /></button></div><label>Task<input autoFocus required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="What needs to get done?" /></label><div><label>Due date<input type="date" value={form.due} onChange={(event) => setForm({ ...form, due: event.target.value })} /></label><label>Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></label><label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>Work</option><option>Personal</option><option>Learning</option></select></label></div><button className={styles.submit}>{editing ? "Save changes" : "Add to inbox"}</button></form>}
        <div className={styles.taskLayout}><aside className={styles.filters}><p>FILTER</p>{filters.map((name) => <button className={filter === name ? styles.active : ""} key={name} onClick={() => setFilter(name)}>{name}<small>{name === "All tasks" ? open.length : name === "High priority" ? open.filter((task) => task.priority === name.split(" ")[0]).length : name === "Today" ? open.filter((task) => task.due === today).length : open.filter((task) => task.category === name).length}</small></button>)}</aside>
            <div className={styles.listPanel}><div className={styles.listHead}><div><h2>{filter}</h2><span>{shown.length} tasks</span></div><span>Sorted by due date</span></div>
                {shown.length ? shown.map((task) => <article className={styles.taskRow} key={task.id}><button className={styles.check} onClick={() => toggle(task.id)} aria-label={"Complete " + task.title}><FiCheck /></button><div className={styles.taskTitle}><strong>{task.title}</strong><span><FiCalendar />{dateLabel(task.due)} <i />{task.category}</span></div><small className={[styles.priority, styles[task.priority.toLowerCase()]].join(" ")}>{task.priority}</small><button className={styles.edit} onClick={() => edit(task)} aria-label={"Edit " + task.title}><FiEdit2 /></button><button className={styles.delete} onClick={() => setRemoving(task)} aria-label={"Delete " + task.title}><FiTrash2 /></button></article>) : <div className={styles.empty}>No open tasks in this view. Add one or change the filter.</div>}
                <section className={styles.completed} id="completed"><h3>Completed <span>{complete.length}</span></h3>{complete.map((task) => <label key={task.id}><input type="checkbox" checked onChange={() => toggle(task.id)} /><span>{task.title}</span><small>{task.category}</small></label>)}</section>
            </div>
        </div>
        {removing && <div className={styles.modal}><section role="dialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-copy"><FiTrash2 /><h2 id="delete-title">Delete this task?</h2><p id="delete-copy"><strong>{removing.title}</strong> will be removed from this list.</p><div><button ref={cancelRef} onClick={() => setRemoving(null)}>Keep task</button><button onClick={() => { setTasks((items) => items.filter((task) => task.id !== removing.id)); setRemoving(null); }}>Delete task</button></div></section></div>}
    </section>;
};
export default TaskManager;
