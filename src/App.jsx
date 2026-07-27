import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Trash2, Pencil, Check, X, Loader2, Dumbbell,
  TrendingUp, CalendarDays, ChevronDown, ChevronRight, Save
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from "recharts";

const DIAS = ["Día 1", "Día 2", "Día 3", "Día 4", "Día 5", "Día 6", "Día 7"];
const GRUPOS = ["Pecho", "Espalda", "Piernas", "Hombros", "Bíceps", "Tríceps", "Trapecio", "Core", "Otro"];

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const gruposDe = (ex) => ex.groups || (ex.group ? [ex.group] : []);

const emptyData = () => ({
  exercises: [],
  weekPlan: DIAS.reduce((acc, d) => ({ ...acc, [d]: [] }), {}),
  logs: {}, // exerciseId -> [{id, date, sets:[{reps, weight}]}]
});

async function generarBoceto(descripcion) {
  const response = await fetch("/api/sketch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ descripcion }),
  });
  const data = await response.json();
  return data.svg || null;
}

function Sketch({ svg, size = 64 }) {
  if (!svg) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center rounded-md bg-white border border-neutral-800 text-neutral-600"
      >
        <Dumbbell size={size * 0.4} />
      </div>
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-md bg-white border border-neutral-800 overflow-hidden flex items-center justify-center"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function SetsEditor({ initialSets, onCancel, onSave }) {
  const [sets, setSets] = useState(
    initialSets && initialSets.length ? initialSets.map((s) => ({ ...s })) : [{ reps: "", weight: "" }]
  );

  const updateSet = (i, field, value) => {
    setSets((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  };
  const addRow = () => setSets((prev) => [...prev, { reps: "", weight: "" }]);
  const removeRow = (i) => setSets((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <div className="mt-2 p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2">
      {sets.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-neutral-400 w-4">{i + 1}</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="Reps"
            value={s.reps}
            onChange={(e) => updateSet(i, "reps", e.target.value)}
            className="w-16 px-2 py-1 text-sm rounded border border-neutral-800 bg-neutral-900 text-neutral-100"
          />
          <span className="text-xs text-neutral-500">×</span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="Kg"
            value={s.weight}
            onChange={(e) => updateSet(i, "weight", e.target.value)}
            className="w-16 px-2 py-1 text-sm rounded border border-neutral-800 bg-neutral-900 text-neutral-100"
          />
          <span className="text-xs text-neutral-500">kg</span>
          {sets.length > 1 && (
            <button onClick={() => removeRow(i)} className="ml-auto text-neutral-500 hover:text-red-400">
              <X size={14} />
            </button>
          )}
        </div>
      ))}
      <div className="flex items-center justify-between pt-1">
        <button onClick={addRow} className="text-xs text-lime-400 flex items-center gap-1 font-medium">
          <Plus size={12} /> Añadir serie
        </button>
        <div className="flex gap-2">
          <button onClick={onCancel} className="text-xs px-2 py-1 text-neutral-400">
            Cancelar
          </button>
          <button
            onClick={() => {
              const cleaned = sets
                .map((s) => ({ reps: Number(s.reps) || 0, weight: Number(s.weight) || 0 }))
                .filter((s) => s.reps > 0);
              if (cleaned.length) onSave(cleaned);
            }}
            className="text-xs px-3 py-1 bg-lime-400 text-neutral-900 rounded-md flex items-center gap-1 font-medium"
          >
            <Save size={12} /> Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

const USER_STORAGE_KEY = "gym-user-id";

const sanitizeUser = (name) =>
  name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);

function QuienEres({ onEntrar }) {
  const [nombre, setNombre] = useState("");
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6">
      <div className="w-full max-w-xs">
        <div className="flex items-center gap-2 justify-center mb-1">
          <span className="w-2.5 h-6 bg-lime-400 rounded-sm" />
          <h1 className="text-2xl font-black tracking-tight uppercase">GYM</h1>
        </div>
        <p className="text-xs text-neutral-500 text-center mb-6">¿Quién eres?</p>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onEntrar(nombre)}
          placeholder="Tu nombre"
          autoFocus
          className="w-full px-3 py-2 text-sm rounded-md border border-neutral-800 bg-neutral-900 text-neutral-100 text-center"
        />
        <button
          onClick={() => onEntrar(nombre)}
          disabled={!nombre.trim()}
          className="w-full mt-3 bg-lime-400 disabled:bg-neutral-800 disabled:text-neutral-600 text-neutral-900 text-sm font-semibold py-2 rounded-md"
        >
          Entrar
        </button>
        <p className="text-[11px] text-neutral-600 text-center mt-4">
          Cada nombre tiene su propia tabla y su propio progreso.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(emptyData());
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("ejercicios");
  const [userId, setUserId] = useState(() => localStorage.getItem(USER_STORAGE_KEY) || "");

  useEffect(() => {
    if (!userId) {
      setLoaded(true);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/data?user=${encodeURIComponent(userId)}`);
        const json = await res.json();
        if (json && json.data) setData(json.data);
      } catch (e) {
        console.error("Error cargando datos", e);
      } finally {
        setLoaded(true);
      }
    })();
  }, [userId]);

  const persist = useCallback(
    async (next) => {
      setData(next);
      try {
        await fetch(`/api/data?user=${encodeURIComponent(userId)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        });
      } catch (e) {
        console.error("Error guardando datos", e);
      }
    },
    [userId]
  );

  const entrar = (nombre) => {
    const clean = sanitizeUser(nombre);
    if (!clean) return;
    localStorage.setItem(USER_STORAGE_KEY, clean);
    setData(emptyData());
    setLoaded(false);
    setUserId(clean);
  };

  const cambiarUsuario = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setData(emptyData());
    setUserId("");
  };

  if (!userId) {
    return <QuienEres onEntrar={entrar} />;
  }

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-500">
        <Loader2 className="animate-spin mr-2" size={18} /> Cargando…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans pb-10">
      <header className="bg-neutral-950 text-neutral-100 px-5 pt-6 pb-4 sticky top-0 z-10 border-b border-neutral-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-6 bg-lime-400 rounded-sm" />
            <h1 className="text-2xl font-black tracking-tight uppercase" style={{ letterSpacing: "0.02em" }}>
              GYM
            </h1>
          </div>
          <button onClick={cambiarUsuario} className="text-[11px] text-neutral-500 underline">
            {userId} · cambiar
          </button>
        </div>
        <p className="text-xs text-neutral-500 mt-1 ml-4">Tu tabla, tu progreso.</p>
        <nav className="flex gap-1 mt-4">
          {[
            { id: "ejercicios", label: "Ejercicios" },
            { id: "semana", label: "Días" },
            { id: "progreso", label: "Progreso" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t-md ${
                tab === t.id ? "bg-lime-400 text-neutral-900" : "bg-neutral-900 text-neutral-500"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="px-4 pt-4">
        {tab === "ejercicios" && <EjerciciosTab data={data} persist={persist} />}
        {tab === "semana" && <SemanaTab data={data} persist={persist} />}
        {tab === "progreso" && <ProgresoTab data={data} persist={persist} />}
      </main>
    </div>
  );
}

// ---------- TAB: EJERCICIOS ----------
function EjerciciosTab({ data, persist }) {
  const [name, setName] = useState("");
  const [groups, setGroups] = useState([]);
  const [desc, setDesc] = useState("");
  const [generating, setGenerating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const toggleGroup = (g) => {
    setGroups((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  const crearEjercicio = async () => {
    if (!name.trim() || !desc.trim() || !groups.length) return;
    setGenerating(true);
    let svg = null;
    try {
      svg = await generarBoceto(desc.trim());
    } catch (e) {
      console.error(e);
    }
    const nuevo = { id: uid(), name: name.trim(), groups, description: desc.trim(), svg };
    await persist({ ...data, exercises: [...data.exercises, nuevo] });
    setName("");
    setGroups([]);
    setDesc("");
    setGenerating(false);
  };

  const eliminarEjercicio = async (id) => {
    const exercises = data.exercises.filter((e) => e.id !== id);
    const weekPlan = Object.fromEntries(
      Object.entries(data.weekPlan).map(([d, ids]) => [d, ids.filter((i) => i !== id)])
    );
    const logs = { ...data.logs };
    delete logs[id];
    await persist({ ...data, exercises, weekPlan, logs });
  };

  const guardarNombre = async (id) => {
    if (!editingName.trim()) return setEditingId(null);
    const exercises = data.exercises.map((e) => (e.id === id ? { ...e, name: editingName.trim() } : e));
    await persist({ ...data, exercises });
    setEditingId(null);
  };

  const porGrupo = GRUPOS.reduce((acc, g) => {
    acc[g] = data.exercises.filter((e) => gruposDe(e).includes(g));
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-200 mb-3">Nuevo ejercicio</h2>
        <div className="space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del ejercicio (ej. Press banca)"
            className="w-full px-3 py-2 text-sm rounded-md border border-neutral-800"
          />
          <div className="flex flex-wrap gap-1.5">
            {GRUPOS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => toggleGroup(g)}
                className={`px-2.5 py-1 text-xs rounded-full border ${
                  groups.includes(g)
                    ? "bg-lime-400 border-lime-400 text-neutral-900"
                    : "bg-neutral-900 border-neutral-800 text-neutral-300"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Describe cómo se hace el ejercicio (esto se usa para dibujar el boceto)"
            rows={2}
            className="w-full px-3 py-2 text-sm rounded-md border border-neutral-800"
          />
          <button
            onClick={crearEjercicio}
            disabled={generating || !name.trim() || !desc.trim() || !groups.length}
            className="w-full flex items-center justify-center gap-2 bg-lime-400 disabled:bg-neutral-800 text-neutral-900 disabled:text-neutral-600 text-sm font-semibold py-2 rounded-md"
          >
            {generating ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Dibujando boceto…
              </>
            ) : (
              <>
                <Plus size={14} /> Crear ejercicio
              </>
            )}
          </button>
        </div>
      </div>

      {GRUPOS.map((g) =>
        porGrupo[g].length ? (
          <div key={g}>
            <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-2">{g}</h3>
            <div className="space-y-2">
              {porGrupo[g].map((ex) => (
                <div key={ex.id} className="bg-neutral-900 rounded-xl border border-neutral-800 p-3 flex items-center gap-3">
                  <Sketch svg={ex.svg} size={56} />
                  <div className="flex-1 min-w-0">
                    {editingId === ex.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm rounded border border-neutral-800"
                          autoFocus
                        />
                        <button onClick={() => guardarNombre(ex.id)} className="text-lime-400">
                          <Check size={16} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-neutral-500">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{ex.name}</span>
                        <button
                          onClick={() => {
                            setEditingId(ex.id);
                            setEditingName(ex.name);
                          }}
                          className="text-neutral-500"
                        >
                          <Pencil size={13} />
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-neutral-500 truncate">{ex.description}</p>
                  </div>
                  {confirmDeleteId === ex.id ? (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-neutral-400">¿Borrar?</span>
                      <button
                        onClick={() => {
                          eliminarEjercicio(ex.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-1.5 py-0.5 bg-red-500 text-white rounded"
                      >
                        Sí
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-1.5 py-0.5 bg-neutral-800 rounded"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(ex.id)}
                      className="text-neutral-600 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null
      )}

      {!data.exercises.length && (
        <p className="text-center text-sm text-neutral-500 py-6">
          Todavía no tienes ejercicios. Crea el primero arriba.
        </p>
      )}
    </div>
  );
}

// ---------- TAB: SEMANA ----------
function SemanaTab({ data, persist }) {
  const [openDay, setOpenDay] = useState(DIAS[0]);
  const [addingTo, setAddingTo] = useState(null);
  const [loggingId, setLoggingId] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null); // `${day}|${exId}`

  const addExerciseToDay = async (day, exId) => {
    if (data.weekPlan[day].includes(exId)) return setAddingTo(null);
    const weekPlan = { ...data.weekPlan, [day]: [...data.weekPlan[day], exId] };
    await persist({ ...data, weekPlan });
    setAddingTo(null);
  };

  const removeFromDay = async (day, exId) => {
    const weekPlan = { ...data.weekPlan, [day]: data.weekPlan[day].filter((i) => i !== exId) };
    await persist({ ...data, weekPlan });
  };

  const saveLog = async (exId, sets) => {
    const entry = { id: uid(), date: new Date().toISOString().slice(0, 10), sets };
    const logs = { ...data.logs, [exId]: [...(data.logs[exId] || []), entry] };
    await persist({ ...data, logs });
    setLoggingId(null);
  };

  const lastLog = (exId) => {
    const arr = data.logs[exId];
    if (!arr || !arr.length) return null;
    return arr[arr.length - 1];
  };

  return (
    <div className="space-y-3">
      {DIAS.map((day) => {
        const ids = data.weekPlan[day] || [];
        const isOpen = openDay === day;
        return (
          <div key={day} className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
            <button
              onClick={() => setOpenDay(isOpen ? null : day)}
              className="w-full flex items-center justify-between px-4 py-3"
            >
              <span className="text-sm font-bold flex items-center gap-2">
                <CalendarDays size={15} className="text-lime-400" /> {day}
              </span>
              <span className="flex items-center gap-2 text-xs text-neutral-500">
                {ids.length} ejercicio{ids.length !== 1 ? "s" : ""}
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 space-y-2 border-t border-neutral-800 pt-3">
                {ids.map((exId) => {
                  const ex = data.exercises.find((e) => e.id === exId);
                  if (!ex) return null;
                  const last = lastLog(exId);
                  return (
                    <div key={exId} className="bg-neutral-800/60 rounded-lg border border-neutral-800 p-2.5">
                      <div className="flex items-center gap-2">
                        <Sketch svg={ex.svg} size={40} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{ex.name}</p>
                          <p className="text-xs text-neutral-500">
                            {last
                              ? `Últ. (${last.date}): ` +
                                last.sets.map((s) => `${s.reps}×${s.weight}kg`).join(", ")
                              : "Sin registros aún"}
                          </p>
                        </div>
                        {confirmRemove === `${day}|${exId}` ? (
                          <div className="flex items-center gap-1 text-xs">
                            <button
                              onClick={() => {
                                removeFromDay(day, exId);
                                setConfirmRemove(null);
                              }}
                              className="px-1.5 py-0.5 bg-red-500 text-white rounded"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setConfirmRemove(null)}
                              className="px-1.5 py-0.5 bg-neutral-800 rounded"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmRemove(`${day}|${exId}`)}
                            className="text-neutral-600 hover:text-red-400"
                          >
                            <X size={15} />
                          </button>
                        )}
                      </div>
                      {loggingId === exId ? (
                        <SetsEditor
                          initialSets={null}
                          onCancel={() => setLoggingId(null)}
                          onSave={(sets) => saveLog(exId, sets)}
                        />
                      ) : (
                        <button
                          onClick={() => setLoggingId(exId)}
                          className="mt-2 text-xs font-semibold text-lime-400 flex items-center gap-1"
                        >
                          <Plus size={12} /> Registrar hoy
                        </button>
                      )}
                    </div>
                  );
                })}

                {addingTo === day ? (
                  <select
                    autoFocus
                    onChange={(e) => e.target.value && addExerciseToDay(day, e.target.value)}
                    className="w-full px-2 py-2 text-sm rounded-md border border-neutral-800 bg-neutral-900 text-neutral-100"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Elige un ejercicio…
                    </option>
                    {GRUPOS.map((g) => {
                      const opts = data.exercises.filter((e) => gruposDe(e).includes(g) && !ids.includes(e.id));
                      if (!opts.length) return null;
                      return (
                        <optgroup key={g} label={g}>
                          {opts.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.name}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                ) : (
                  <button
                    onClick={() => setAddingTo(day)}
                    className="text-xs font-semibold text-neutral-400 flex items-center gap-1"
                  >
                    <Plus size={12} /> Añadir ejercicio a {day}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------- TAB: PROGRESO ----------
function ProgresoTab({ data, persist }) {
  const [selected, setSelected] = useState(data.exercises[0]?.id || "");
  const [editingLog, setEditingLog] = useState(null);
  const [confirmDeleteLog, setConfirmDeleteLog] = useState(null);

  const ex = data.exercises.find((e) => e.id === selected);
  const entries = (data.logs[selected] || []).slice().sort((a, b) => (a.date > b.date ? 1 : -1));

  const chartData = entries.map((e) => ({
    date: e.date,
    pesoMax: Math.max(...e.sets.map((s) => s.weight)),
    volumen: e.sets.reduce((sum, s) => sum + s.reps * s.weight, 0),
  }));

  const updateEntry = async (logId, sets) => {
    const logs = {
      ...data.logs,
      [selected]: data.logs[selected].map((l) => (l.id === logId ? { ...l, sets } : l)),
    };
    await persist({ ...data, logs });
    setEditingLog(null);
  };

  const deleteEntry = async (logId) => {
    const logs = { ...data.logs, [selected]: data.logs[selected].filter((l) => l.id !== logId) };
    await persist({ ...data, logs });
  };

  if (!data.exercises.length) {
    return <p className="text-center text-sm text-neutral-500 py-6">Crea algún ejercicio primero.</p>;
  }

  return (
    <div className="space-y-4">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-md border border-neutral-800 bg-neutral-900 text-neutral-100"
      >
        {GRUPOS.map((g) => {
          const opts = data.exercises.filter((e) => gruposDe(e).includes(g));
          if (!opts.length) return null;
          return (
            <optgroup key={g} label={g}>
              {opts.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>

      {ex && (
        <div className="flex items-center gap-3 bg-neutral-900 rounded-xl border border-neutral-800 p-3">
          <Sketch svg={ex.svg} size={48} />
          <div>
            <p className="text-sm font-semibold">{ex.name}</p>
            <p className="text-xs text-neutral-500">{gruposDe(ex).join(", ")}</p>
          </div>
        </div>
      )}

      {entries.length ? (
        <>
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-2 flex items-center gap-1">
              <TrendingUp size={13} className="text-lime-400" /> Evolución
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#a1a1aa" }} />
                <YAxis tick={{ fontSize: 10, fill: "#a1a1aa" }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11, color: "#d4d4d8" }} />
                <Line type="monotone" dataKey="pesoMax" name="Peso máx (kg)" stroke="#d4ff3d" strokeWidth={2} />
                <Line type="monotone" dataKey="volumen" name="Volumen (reps×kg)" stroke="#ff5c5c" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            {entries.map((entry) => (
              <div key={entry.id} className="bg-neutral-900 rounded-xl border border-neutral-800 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{entry.date}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingLog(editingLog === entry.id ? null : entry.id)}
                      className="text-neutral-500"
                    >
                      <Pencil size={14} />
                    </button>
                    {confirmDeleteLog === entry.id ? (
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-neutral-400">¿Borrar?</span>
                        <button
                          onClick={() => {
                            deleteEntry(entry.id);
                            setConfirmDeleteLog(null);
                          }}
                          className="px-1.5 py-0.5 bg-red-500 text-white rounded"
                        >
                          Sí
                        </button>
                        <button
                          onClick={() => setConfirmDeleteLog(null)}
                          className="px-1.5 py-0.5 bg-neutral-800 rounded"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteLog(entry.id)}
                        className="text-neutral-600 hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                {editingLog === entry.id ? (
                  <SetsEditor
                    initialSets={entry.sets}
                    onCancel={() => setEditingLog(null)}
                    onSave={(sets) => updateEntry(entry.id, sets)}
                  />
                ) : (
                  <p className="text-xs text-neutral-400 mt-1">
                    {entry.sets.map((s) => `${s.reps}×${s.weight}kg`).join("  ·  ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-center text-sm text-neutral-500 py-6">
          Aún no hay registros para este ejercicio.
        </p>
      )}
    </div>
  );
}
