import { useEffect, useMemo, useRef, useState } from "react";
import { FiCalendar, FiCheck, FiEdit2, FiPlus, FiSearch, FiTrash2, FiX } from "react-icons/fi";
import styles from "./styles.module.css";

const STORAGE_KEY = "task-manager-items";
const PRIORITIES = ["Low", "Medium", "High"];
const CATEGORIES = ["Work", "Personal", "Learning"];

const getLocalDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const isValidDate = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const seedTasks = () => {
    const due = getLocalDate();
    return [
        { id: "a", title: "Send the project outline", due, priority: "High", category: "Work", done: false },
        { id: "b", title: "Book a dentist appointment", due, priority: "Medium", category: "Personal", done: false },
        { id: "c", title: "Review the reading notes", due, priority: "Low", category: "Learning", done: true },
        { id: "d", title: "Prepare next week's plan", due, priority: "Medium", category: "Work", done: false },
        { id: "e", title: "Pay the electricity bill", due, priority: "High", category: "Personal", done: false },
    ];
};

const isTask = (task) => task &&
    typeof task.id === "string" && task.id.length > 0 &&
    typeof task.title === "string" && task.title.trim().length > 0 &&
    isValidDate(task.due) && PRIORITIES.includes(task.priority) &&
    CATEGORIES.includes(task.category) && typeof task.done === "boolean";

const loadTasks = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === null) return seedTasks();
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed.filter(isTask) : seedTasks();
    } catch {
        return seedTasks();
    }
};

const createBlankForm = () => ({ title: "", due: getLocalDate(), priority: "Medium", category: "Work" });

const TaskManager = () => {
    const [today, setToday] = useState(getLocalDate);
    const [tasks, setTasks] = useState(loadTasks);
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState("All tasks");
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(createBlankForm);
    const [editingId, setEditingId] = useState(null);
    const [removing, setRemoving] = useState(null);
    const [storageIssue, setStorageIssue] = useState(false);
    const cancelRef = useRef(null);
    const deleteTriggerRef = useRef(null);
    const addButtonRef = useRef(null);

    const updateTasks = (getNextTasks) => {
        const nextTasks = getNextTasks(tasks);
        setTasks(nextTasks);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTasks));
            setStorageIssue(false);
        } catch {
            setStorageIssue(true);
        }
    };

    useEffect(() => {
        if (!removing) {
            const focusTarget = deleteTriggerRef.current;
            if (focusTarget?.isConnected) focusTarget.focus();
            else if (deleteTriggerRef.current) addButtonRef.current?.focus();
            deleteTriggerRef.current = null;
            return undefined;
        }

        cancelRef.current?.focus();
        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                setRemoving(null);
                return;
            }
            if (event.key === "Tab") {
                const buttons = Array.from(document.querySelectorAll('[data-delete-dialog] button'));
                if (buttons.length < 2) return;
                const first = buttons[0];
                const last = buttons[buttons.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [removing]);

    useEffect(() => {
        const refreshAtMidnight = () => {
            setToday(getLocalDate());
            const now = new Date();
            const nextMidnight = new Date(now);
            nextMidnight.setHours(24, 0, 0, 20);
            timer = window.setTimeout(refreshAtMidnight, nextMidnight.getTime() - now.getTime());
        };
        let timer = window.setTimeout(refreshAtMidnight, 60_000);
        return () => window.clearTimeout(timer);
    }, []);

    const openTasks = tasks.filter((task) => !task.done);
    const completedTasks = tasks.filter((task) => task.done);
    const filters = ["All tasks", "Today", "High priority", ...CATEGORIES];
    const shownTasks = useMemo(() => {
        const search = query.trim().toLowerCase();
        return tasks
            .filter((task) => !task.done)
            .filter((task) => filter === "All tasks" ||
                (filter === "Today" ? task.due === today :
                    filter === "High priority" ? task.priority === "High" : task.category === filter))
            .filter((task) => !search || `${task.title} ${task.category} ${task.priority} ${task.due}`.toLowerCase().includes(search))
            .sort((a, b) => a.due.localeCompare(b.due) || a.title.localeCompare(b.title));
    }, [tasks, filter, query, today]);

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setForm(createBlankForm());
    };

    const saveTask = (event) => {
        event.preventDefault();
        const title = form.title.trim();
        if (!title) {
            const titleInput = event.currentTarget.elements.namedItem("title");
            titleInput.setCustomValidity("Enter a task name.");
            titleInput.reportValidity();
            return;
        }
        if (title.length > 120 || !isValidDate(form.due) ||
            !PRIORITIES.includes(form.priority) || !CATEGORIES.includes(form.category)) return;

        if (editingId) {
            updateTasks((current) => current.map((task) => task.id === editingId ? { ...task, ...form, title } : task));
        } else {
            updateTasks((current) => [...current, { ...form, id: crypto.randomUUID(), title, done: false }]);
        }
        closeForm();
    };

    const editTask = (task) => {
        setForm({ title: task.title, due: task.due, priority: task.priority, category: task.category });
        setEditingId(task.id);
        setShowForm(true);
    };

    const toggleTask = (id) => {
        updateTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task));
    };

    const requestDelete = (task, event) => {
        deleteTriggerRef.current = event.currentTarget;
        setRemoving(task);
    };

    const dateLabel = (value) => value === today ? "Today" :
        new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00`));

    const countFor = (name) => {
        if (name === "All tasks") return openTasks.length;
        if (name === "Today") return openTasks.filter((task) => task.due === today).length;
        if (name === "High priority") return openTasks.filter((task) => task.priority === "High").length;
        return openTasks.filter((task) => task.category === name).length;
    };

    return (
        <section className={styles.taskPage} id="inbox">
            <header className={styles.heading}>
                <div>
                    <p className={styles.label}>A clear place to begin</p>
                    <h1>Work from one list.</h1>
                    <p>Catch the task, choose its priority, and move on.</p>
                </div>
                <button ref={addButtonRef} className={styles.addButton} type="button" onClick={() => {
                    setEditingId(null);
                    setForm(createBlankForm());
                    setShowForm((visible) => !visible);
                }}>
                    <FiPlus aria-hidden="true" />New task
                </button>
            </header>

            {storageIssue && <p className={styles.storageNotice} role="alert">
                Browser storage is unavailable. Changes will be lost when you leave this page.
            </p>}

            <div className={styles.summary}>
                <div><span>Inbox</span><strong>{openTasks.length}</strong></div>
                <div><span>Due today</span><strong>{openTasks.filter((task) => task.due === today).length}</strong></div>
                <div><span>Completed</span><strong>{completedTasks.length}</strong></div>
                <div className={styles.search}>
                    <FiSearch aria-hidden="true" />
                    <input placeholder="Search tasks" aria-label="Search tasks" value={query} onChange={(event) => setQuery(event.target.value)} />
                </div>
            </div>

            {showForm && <form className={styles.form} onSubmit={saveTask}>
                <div className={styles.formHead}>
                    <strong>{editingId ? "Edit task" : "Add a task"}</strong>
                    <button type="button" onClick={closeForm} aria-label="Close form"><FiX /></button>
                </div>
                <label>Task
                    <input name="title" autoFocus required maxLength={120} value={form.title} onChange={(event) => {
                        event.currentTarget.setCustomValidity("");
                        setForm({ ...form, title: event.target.value });
                    }} placeholder="What needs to get done?" />
                </label>
                <div>
                    <label>Due date
                        <input type="date" required value={form.due} onChange={(event) => setForm({ ...form, due: event.target.value })} />
                    </label>
                    <label>Priority
                        <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
                            {PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}
                        </select>
                    </label>
                    <label>Category
                        <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                            {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                        </select>
                    </label>
                </div>
                <button className={styles.submit} type="submit">{editingId ? "Save changes" : "Add to inbox"}</button>
            </form>}

            <div className={styles.taskLayout}>
                <aside className={styles.filters} aria-label="Filter tasks">
                    <p>FILTER</p>
                    {filters.map((name) => <button className={filter === name ? styles.active : ""} key={name} type="button" onClick={() => setFilter(name)}>
                        {name}<small>{countFor(name)}</small>
                    </button>)}
                </aside>

                <div className={styles.listPanel}>
                    <div className={styles.listHead}>
                        <div><h2>{filter}</h2><span>{shownTasks.length} tasks</span></div>
                        <span>Sorted by due date</span>
                    </div>
                    {shownTasks.length ? shownTasks.map((task) => <article className={styles.taskRow} key={task.id}>
                        <button className={styles.check} type="button" onClick={() => toggleTask(task.id)} aria-label={`Complete ${task.title}`}>
                            <FiCheck aria-hidden="true" />
                        </button>
                        <div className={styles.taskTitle}>
                            <strong>{task.title}</strong>
                            <span><FiCalendar aria-hidden="true" />{dateLabel(task.due)} <i />{task.category}</span>
                        </div>
                        <small className={[styles.priority, styles[task.priority.toLowerCase()]].join(" ")}>{task.priority}</small>
                        <button className={styles.edit} type="button" onClick={() => editTask(task)} aria-label={`Edit ${task.title}`}><FiEdit2 aria-hidden="true" /></button>
                        <button className={styles.delete} type="button" onClick={(event) => requestDelete(task, event)} aria-label={`Delete ${task.title}`}><FiTrash2 aria-hidden="true" /></button>
                    </article>) : <div className={styles.empty}>No open tasks in this view. Add one or change the filter.</div>}

                    <section className={styles.completed} id="completed" aria-labelledby="completed-title">
                        <h3 id="completed-title">Completed <span>{completedTasks.length}</span></h3>
                        {completedTasks.map((task) => <label key={task.id}>
                            <input type="checkbox" checked onChange={() => toggleTask(task.id)} aria-label={`Reopen ${task.title}`} />
                            <span>{task.title}</span><small>{task.category}</small>
                        </label>)}
                    </section>
                </div>
            </div>

            {removing && <div className={styles.modal}>
                <section data-delete-dialog role="dialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-copy">
                    <FiTrash2 aria-hidden="true" />
                    <h2 id="delete-title">Delete this task?</h2>
                    <p id="delete-copy"><strong>{removing.title}</strong> will be removed from this list.</p>
                    <div>
                        <button ref={cancelRef} type="button" onClick={() => setRemoving(null)}>Keep task</button>
                        <button type="button" onClick={() => {
                            updateTasks((current) => current.filter((task) => task.id !== removing.id));
                            setRemoving(null);
                        }}>Delete task</button>
                    </div>
                </section>
            </div>}
        </section>
    );
};

export default TaskManager;
