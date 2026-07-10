import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEvent } from "../services/eventService";
import "../styles/createEvent.css";

const emptyTier = { tier: "general", rows: 5, seatsPerRow: 10, price: 500 };

// Seat editor modes
const EDITOR_MODES = {
  ADD: 'add',
  REMOVE: 'remove',
  CHANGE_TIER: 'changeTier'
};

// Tier colors for visual editor
const TIER_COLORS = {
  general: { bg: 'rgba(139, 92, 246, 0.3)', border: '#8B5CF6', name: 'General' },
  silver: { bg: 'rgba(192, 192, 192, 0.3)', border: '#C0C0C0', name: 'Silver' },
  gold: { bg: 'rgba(255, 215, 0, 0.3)', border: '#FFD700', name: 'Gold' },
  platinum: { bg: 'rgba(229, 228, 226, 0.3)', border: '#E5E4E2', name: 'Platinum' },
  empty: { bg: 'transparent', border: 'rgba(255, 255, 255, 0.1)', name: 'Empty' }
};

// Seating layout templates for different venue types
const LAYOUT_TEMPLATES = {
  theater: {
    name: "Theater/Cinema",
    icon: "🎭",
    description: "Curved rows facing a stage",
    tiers: [
      { tier: "general", rows: 10, seatsPerRow: 12, price: 300 },
      { tier: "silver", rows: 8, seatsPerRow: 10, price: 500 },
      { tier: "gold", rows: 5, seatsPerRow: 8, price: 800 },
    ]
  },
  stadium: {
    name: "Stadium/Arena",
    icon: "🏟️",
    description: "Large venue with multiple tiers",
    tiers: [
      { tier: "general", rows: 20, seatsPerRow: 15, price: 500 },
      { tier: "silver", rows: 15, seatsPerRow: 12, price: 800 },
      { tier: "gold", rows: 10, seatsPerRow: 10, price: 1200 },
      { tier: "platinum", rows: 5, seatsPerRow: 8, price: 2000 },
    ]
  },
  conference: {
    name: "Conference Hall",
    icon: "🏢",
    description: "Simple rows with uniform seating",
    tiers: [
      { tier: "general", rows: 15, seatsPerRow: 10, price: 200 },
      { tier: "silver", rows: 10, seatsPerRow: 10, price: 350 },
    ]
  },
  club: {
    name: "Club/Bar",
    icon: "🎵",
    description: "Small intimate venue",
    tiers: [
      { tier: "general", rows: 8, seatsPerRow: 8, price: 150 },
      { tier: "gold", rows: 4, seatsPerRow: 6, price: 300 },
    ]
  },
  concert: {
    name: "Concert Hall",
    icon: "🎸",
    description: "Medium venue with stage view",
    tiers: [
      { tier: "general", rows: 12, seatsPerRow: 14, price: 400 },
      { tier: "silver", rows: 10, seatsPerRow: 12, price: 700 },
      { tier: "gold", rows: 6, seatsPerRow: 10, price: 1000 },
      { tier: "platinum", rows: 3, seatsPerRow: 8, price: 1500 },
    ]
  },
  custom: {
    name: "Custom Layout",
    icon: "⚙️",
    description: "Create your own seating arrangement",
    tiers: [{ tier: "general", rows: 5, seatsPerRow: 10, price: 500 }]
  }
};

const CreateEvent = () => {
  const navigate = useNavigate();
  const [showTemplates, setShowTemplates] = useState(true);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [useAdvancedEditor, setUseAdvancedEditor] = useState(false);
  const [seatGrid, setSeatGrid] = useState([]);
  const [gridDimensions, setGridDimensions] = useState({ rows: 10, cols: 15 });
  const [editorMode, setEditorMode] = useState(EDITOR_MODES.ADD);
  const [selectedTier, setSelectedTier] = useState('general');
  const [tierPrices, setTierPrices] = useState({
    general: 500,
    silver: 800,
    gold: 1200,
    platinum: 2000
  });
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "music",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    venueName: "",
    address: "",
    city: "",
  });
  const [seatConfig, setSeatConfig] = useState([{ ...emptyTier }]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Initialize empty seat grid
  const initializeSeatGrid = (rows, cols) => {
    const grid = [];
    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < cols; j++) {
        row.push({ tier: 'empty', seatId: null });
      }
      grid.push(row);
    }
    return grid;
  };

  // Apply template - can switch between simple config and advanced editor
  const applyTemplate = (templateKey, advanced = false) => {
    const template = LAYOUT_TEMPLATES[templateKey];
    
    if (advanced) {
      // Initialize grid for advanced editor
      const rows = template.tiers.reduce((sum, t) => sum + t.rows, 0);
      const cols = Math.max(...template.tiers.map(t => t.seatsPerRow));
      setGridDimensions({ rows, cols });
      
      // Create grid from template
      const grid = initializeSeatGrid(rows, cols);
      let currentRow = 0;
      
      template.tiers.forEach(tier => {
        for (let i = 0; i < tier.rows; i++) {
          for (let j = 0; j < tier.seatsPerRow; j++) {
            if (currentRow < rows && j < cols) {
              const seatId = `${String.fromCharCode(65 + currentRow)}${j + 1}`;
              grid[currentRow][j] = { tier: tier.tier, seatId };
            }
          }
          currentRow++;
        }
      });
      
      setSeatGrid(grid);
      setUseAdvancedEditor(true);
      
      // Set tier prices
      const prices = {};
      template.tiers.forEach(t => {
        prices[t.tier] = t.price;
      });
      setTierPrices({ ...tierPrices, ...prices });
    } else {
      // Use simple config mode
      setSeatConfig(template.tiers.map(t => ({ ...t })));
      setUseAdvancedEditor(false);
    }
    
    setSelectedLayout(templateKey);
    setShowTemplates(false);
  };

  // Handle seat click in advanced editor
  const handleSeatClick = (rowIndex, colIndex) => {
    const newGrid = [...seatGrid];
    
    if (editorMode === EDITOR_MODES.ADD) {
      const seatId = `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`;
      newGrid[rowIndex][colIndex] = { tier: selectedTier, seatId };
    } else if (editorMode === EDITOR_MODES.REMOVE) {
      newGrid[rowIndex][colIndex] = { tier: 'empty', seatId: null };
    } else if (editorMode === EDITOR_MODES.CHANGE_TIER) {
      if (newGrid[rowIndex][colIndex].tier !== 'empty') {
        newGrid[rowIndex][colIndex] = { ...newGrid[rowIndex][colIndex], tier: selectedTier };
      }
    }
    
    setSeatGrid(newGrid);
  };

  // Add row to grid
  const addRow = () => {
    const newRow = Array(gridDimensions.cols).fill(null).map(() => ({ tier: 'empty', seatId: null }));
    setSeatGrid([...seatGrid, newRow]);
    setGridDimensions({ ...gridDimensions, rows: gridDimensions.rows + 1 });
  };

  // Add column to grid
  const addColumn = () => {
    const newGrid = seatGrid.map(row => [...row, { tier: 'empty', seatId: null }]);
    setSeatGrid(newGrid);
    setGridDimensions({ ...gridDimensions, cols: gridDimensions.cols + 1 });
  };

  // Remove last row
  const removeRow = () => {
    if (gridDimensions.rows > 1) {
      setSeatGrid(seatGrid.slice(0, -1));
      setGridDimensions({ ...gridDimensions, rows: gridDimensions.rows - 1 });
    }
  };

  // Remove last column
  const removeColumn = () => {
    if (gridDimensions.cols > 1) {
      const newGrid = seatGrid.map(row => row.slice(0, -1));
      setSeatGrid(newGrid);
      setGridDimensions({ ...gridDimensions, cols: gridDimensions.cols - 1 });
    }
  };

  // Convert grid to seatConfig for backend
  const convertGridToSeatConfig = () => {
    const tierMap = {};
    
    // Group consecutive seats by tier and row
    seatGrid.forEach((row, rowIndex) => {
      row.forEach((seat, colIndex) => {
        if (seat.tier !== 'empty') {
          if (!tierMap[seat.tier]) {
            tierMap[seat.tier] = {
              seats: [],
              rowMap: {}
            };
          }
          
          if (!tierMap[seat.tier].rowMap[rowIndex]) {
            tierMap[seat.tier].rowMap[rowIndex] = [];
          }
          
          tierMap[seat.tier].rowMap[rowIndex].push(seat);
          tierMap[seat.tier].seats.push(seat);
        }
      });
    });

    // Convert to proper seatConfig format
    return Object.entries(tierMap).map(([tier, data]) => {
      const rowCount = Object.keys(data.rowMap).length;
      const seatsPerRow = Math.max(...Object.values(data.rowMap).map(row => row.length));
      
      return {
        tier,
        rows: rowCount || 1,
        seatsPerRow: seatsPerRow || 1,
        price: tierPrices[tier] || 500
      };
    });
  };

  const updateTier = (index, field, value) => {
    setSeatConfig((prev) => prev.map((tier, i) => (i === index ? { ...tier, [field]: value } : tier)));
  };

  const addTier = () => setSeatConfig((prev) => [...prev, { ...emptyTier, tier: "gold", price: 1500 }]);
  const removeTier = (index) => setSeatConfig((prev) => prev.filter((_, i) => i !== index));

  const totalSeats = useAdvancedEditor 
    ? seatGrid.flat().filter(s => s.tier !== 'empty').length
    : seatConfig.reduce((sum, t) => sum + Number(t.rows) * Number(t.seatsPerRow), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Combine date and time for backend
      const startDateTime = `${form.startDate}T${form.startTime}`;
      const endDateTime = `${form.endDate}T${form.endTime}`;

      // Use grid config if advanced editor, otherwise use simple config
      const finalSeatConfig = useAdvancedEditor ? convertGridToSeatConfig() : seatConfig;

      // Validate seat config
      if (!finalSeatConfig || finalSeatConfig.length === 0) {
        setError("Please configure at least one seating tier");
        setLoading(false);
        return;
      }

      const { event } = await createEvent({
        title: form.title,
        description: form.description,
        category: form.category,
        startDateTime,
        endDateTime,
        venue: { name: form.venueName, address: form.address, city: form.city },
        seatConfig: finalSeatConfig.map((t) => ({
          tier: t.tier,
          rows: Number(t.rows),
          seatsPerRow: Number(t.seatsPerRow),
          price: Number(t.price),
        })),
      });

      navigate(`/events/${event._id}`);
    } catch (err) {
      console.error('Error creating event:', err.response?.data || err.message);
      setError(err.response?.data?.message || err.message || "Could not create event.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container section create-event">
      <h1>Create Event</h1>
      <p className="text-muted" style={{ marginBottom: "var(--space-6)" }}>
        Set up your venue, choose a seating layout, configure tiers and pricing
      </p>

      {error && <div className="auth-error" style={{ marginBottom: "var(--space-4)" }}>{error}</div>}

      <form onSubmit={handleSubmit} className="create-event__form">
        <div className="create-event__grid">
          <label>
            Event Title
            <input name="title" required value={form.title} onChange={handleChange} placeholder="Summer Music Festival 2026" />
          </label>
          <label>
            Category
            <select name="category" value={form.category} onChange={handleChange}>
              <option value="music">Music</option>
              <option value="sports">Sports</option>
              <option value="movies">Movies</option>
              <option value="comedy">Comedy</option>
              <option value="conference">Conference</option>
              <option value="festival">Festival</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>

        <label>
          Description
          <textarea name="description" required rows={4} value={form.description} onChange={handleChange} placeholder="Describe your event - what makes it special?" />
        </label>

        <div className="create-event__datetime-section">
          <div className="create-event__datetime-card">
            <h3 className="create-event__datetime-title">Start Date & Time</h3>
            <div className="create-event__datetime-inputs">
              <label>
                Date
                <input 
                  type="date" 
                  name="startDate" 
                  required 
                  value={form.startDate} 
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </label>
              <label>
                Time
                <input 
                  type="time" 
                  name="startTime" 
                  required 
                  value={form.startTime} 
                  onChange={handleChange}
                />
              </label>
            </div>
          </div>

          <div className="create-event__datetime-card">
            <h3 className="create-event__datetime-title">End Date & Time</h3>
            <div className="create-event__datetime-inputs">
              <label>
                Date
                <input 
                  type="date" 
                  name="endDate" 
                  required 
                  value={form.endDate} 
                  onChange={handleChange}
                  min={form.startDate || new Date().toISOString().split('T')[0]}
                />
              </label>
              <label>
                Time
                <input 
                  type="time" 
                  name="endTime" 
                  required 
                  value={form.endTime} 
                  onChange={handleChange}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="create-event__grid create-event__grid--three">
          <label>
            Venue Name
            <input name="venueName" required value={form.venueName} onChange={handleChange} placeholder="Phoenix Arena" />
          </label>
          <label>
            Street Address
            <input name="address" required value={form.address} onChange={handleChange} placeholder="123 Main Street" />
          </label>
          <label>
            City
            <input name="city" required value={form.city} onChange={handleChange} placeholder="Mumbai" />
          </label>
        </div>

        {/* Seating Layout Templates */}
        {showTemplates && (
          <div className="create-event__templates">
            <h3 style={{ textAlign: 'center' }}>Choose Seating Layout</h3>
            <p className="text-muted" style={{ marginBottom: "var(--space-4)", fontSize: "0.9rem", textAlign: 'center' }}>
              Select a template that matches your venue type
            </p>
            <div className="create-event__templates-grid">
              {Object.entries(LAYOUT_TEMPLATES).map(([key, template]) => (
                <div key={key} className="create-event__template-card">
                  <div className="create-event__template-icon">{template.icon}</div>
                  <h4>{template.name}</h4>
                  <p>{template.description}</p>
                  <span className="create-event__template-info">
                    {template.tiers.reduce((sum, t) => sum + t.rows * t.seatsPerRow, 0)} seats · {template.tiers.length} tiers
                  </span>
                  <div className="create-event__template-actions">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => applyTemplate(key, false)}
                    >
                      Simple Mode
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => applyTemplate(key, true)}
                    >
                      Advanced Editor
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seating Configuration */}
        {!showTemplates && !useAdvancedEditor && (
          <div className="create-event__tiers">
            <div className="create-event__tiers-header">
              <div>
                <h3>Seating Configuration</h3>
                <p className="text-muted" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                  {selectedLayout && LAYOUT_TEMPLATES[selectedLayout] ? 
                    `${LAYOUT_TEMPLATES[selectedLayout].name} layout` : 
                    "Custom layout"}
                </p>
              </div>
              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowTemplates(true)}>
                  Change Layout
                </button>
                <button type="button" className="btn btn-outline" onClick={addTier}>
                  + Add Tier
                </button>
              </div>
            </div>

            {/* Visual Seat Preview */}
            <div className="create-event__preview">
              <h4>Seat Map Preview</h4>
              <div className="create-event__preview-stage">STAGE</div>
              <div className="create-event__preview-seats">
                {seatConfig.map((tier, tierIndex) => (
                  <div key={tierIndex} className="create-event__preview-tier">
                    <div className="create-event__preview-tier-label">
                      {tier.tier.toUpperCase()} - ₹{tier.price}
                    </div>
                    {Array.from({ length: Number(tier.rows) }).map((_, rowIndex) => (
                      <div key={rowIndex} className="create-event__preview-row">
                        {Array.from({ length: Number(tier.seatsPerRow) }).map((_, seatIndex) => (
                          <div 
                            key={seatIndex} 
                            className={`create-event__preview-seat create-event__preview-seat--${tier.tier}`}
                            title={`${String.fromCharCode(65 + rowIndex + seatConfig.slice(0, tierIndex).reduce((sum, t) => sum + Number(t.rows), 0))}${seatIndex + 1}`}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="create-event__preview-legend">
                {seatConfig.map((tier, i) => (
                  <div key={i} className="create-event__preview-legend-item">
                    <div className={`create-event__preview-legend-color create-event__preview-legend-color--${tier.tier}`} />
                    <span>{tier.tier.charAt(0).toUpperCase() + tier.tier.slice(1)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tier Configuration Form */}
            <div className="create-event__tiers-list">
              <h4>Configure Tiers</h4>
              {seatConfig.map((tier, i) => (
                <div className="create-event__tier-row" key={i}>
                  <div className="create-event__tier-number">{i + 1}</div>
                  <select value={tier.tier} onChange={(e) => updateTier(i, "tier", e.target.value)}>
                    <option value="general">General</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                    <option value="platinum">Platinum</option>
                  </select>
                  <input 
                    type="number" 
                    min={1} 
                    max={50}
                    value={tier.rows} 
                    onChange={(e) => updateTier(i, "rows", e.target.value)} 
                    placeholder="Rows" 
                  />
                  <input 
                    type="number" 
                    min={1} 
                    max={50}
                    value={tier.seatsPerRow} 
                    onChange={(e) => updateTier(i, "seatsPerRow", e.target.value)} 
                    placeholder="Seats/row" 
                  />
                  <input 
                    type="number" 
                    min={0} 
                    step={50}
                    value={tier.price} 
                    onChange={(e) => updateTier(i, "price", e.target.value)} 
                    placeholder="Price (₹)" 
                  />
                  <div className="create-event__tier-total">
                    {Number(tier.rows) * Number(tier.seatsPerRow)} seats
                  </div>
                  {seatConfig.length > 1 && (
                    <button type="button" className="btn btn-danger" onClick={() => removeTier(i)}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="create-event__summary">
              <div className="create-event__summary-item">
                <span>Total Seats:</span>
                <strong>{totalSeats}</strong>
              </div>
              <div className="create-event__summary-item">
                <span>Total Tiers:</span>
                <strong>{seatConfig.length}</strong>
              </div>
              <div className="create-event__summary-item">
                <span>Price Range:</span>
                <strong>
                  ₹{Math.min(...seatConfig.map(t => Number(t.price)))} - 
                  ₹{Math.max(...seatConfig.map(t => Number(t.price)))}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Seat Editor */}
        {!showTemplates && useAdvancedEditor && (
          <div className="create-event__advanced-editor">
            <div className="create-event__editor-header">
              <div>
                <h3>Advanced Seat Editor</h3>
                <p className="text-muted" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                  Click seats to add, remove, or change tiers. Customize your exact layout.
                </p>
              </div>
              <button type="button" className="btn btn-outline" onClick={() => setShowTemplates(true)}>
                Change Layout
              </button>
            </div>

            {/* Editor Toolbar */}
            <div className="seat-editor__toolbar">
              <div className="seat-editor__mode-selector">
                <button
                  type="button"
                  className={`seat-editor__mode-btn ${editorMode === EDITOR_MODES.ADD ? 'active' : ''}`}
                  onClick={() => setEditorMode(EDITOR_MODES.ADD)}
                >
                  ➕ Add Seats
                </button>
                <button
                  type="button"
                  className={`seat-editor__mode-btn ${editorMode === EDITOR_MODES.REMOVE ? 'active' : ''}`}
                  onClick={() => setEditorMode(EDITOR_MODES.REMOVE)}
                >
                  ✕ Remove Seats
                </button>
                <button
                  type="button"
                  className={`seat-editor__mode-btn ${editorMode === EDITOR_MODES.CHANGE_TIER ? 'active' : ''}`}
                  onClick={() => setEditorMode(EDITOR_MODES.CHANGE_TIER)}
                >
                  🎨 Change Tier
                </button>
              </div>

              {(editorMode === EDITOR_MODES.ADD || editorMode === EDITOR_MODES.CHANGE_TIER) && (
                <div className="seat-editor__tier-selector">
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, marginRight: '12px' }}>Select Tier:</label>
                  {Object.entries(TIER_COLORS).filter(([key]) => key !== 'empty').map(([tier, config]) => (
                    <button
                      key={tier}
                      type="button"
                      className={`seat-editor__tier-btn ${selectedTier === tier ? 'active' : ''}`}
                      style={{ 
                        background: config.bg, 
                        borderColor: config.border,
                        color: selectedTier === tier ? config.border : 'var(--text)'
                      }}
                      onClick={() => setSelectedTier(tier)}
                    >
                      {config.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="seat-editor__grid-controls">
                <div className="seat-editor__grid-control-group">
                  <button type="button" className="btn btn-sm btn-outline" onClick={addRow}>+ Row</button>
                  <button type="button" className="btn btn-sm btn-outline" onClick={removeRow}>- Row</button>
                </div>
                <div className="seat-editor__grid-control-group">
                  <button type="button" className="btn btn-sm btn-outline" onClick={addColumn}>+ Column</button>
                  <button type="button" className="btn btn-sm btn-outline" onClick={removeColumn}>- Column</button>
                </div>
                <span className="seat-editor__grid-info">
                  {gridDimensions.rows} × {gridDimensions.cols} grid
                </span>
              </div>
            </div>

            {/* Stage */}
            <div className="seat-editor__stage">STAGE</div>

            {/* Seat Grid */}
            <div className="seat-editor__grid">
              {seatGrid.map((row, rowIndex) => (
                <div key={rowIndex} className="seat-editor__row">
                  <span className="seat-editor__row-label">{String.fromCharCode(65 + rowIndex)}</span>
                  {row.map((seat, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`seat-editor__seat ${seat.tier !== 'empty' ? 'seat-editor__seat--filled' : ''}`}
                      style={{
                        background: TIER_COLORS[seat.tier]?.bg,
                        borderColor: TIER_COLORS[seat.tier]?.border
                      }}
                      onClick={() => handleSeatClick(rowIndex, colIndex)}
                      title={seat.seatId || 'Empty'}
                    >
                      {seat.tier !== 'empty' && <span className="seat-editor__seat-id">{seat.seatId}</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Tier Pricing */}
            <div className="seat-editor__pricing">
              <h4>Tier Pricing</h4>
              <div className="seat-editor__pricing-grid">
                {Object.entries(TIER_COLORS).filter(([key]) => key !== 'empty').map(([tier, config]) => (
                  <div key={tier} className="seat-editor__pricing-item">
                    <div className="seat-editor__pricing-label">
                      <div 
                        className="seat-editor__pricing-color"
                        style={{ background: config.bg, borderColor: config.border }}
                      />
                      <span>{config.name}</span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      step={50}
                      value={tierPrices[tier] || 500}
                      onChange={(e) => setTierPrices({ ...tierPrices, [tier]: Number(e.target.value) })}
                      placeholder="Price (₹)"
                      style={{ 
                        width: '120px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        color: 'var(--text)',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="create-event__summary">
              <div className="create-event__summary-item">
                <span>Total Seats:</span>
                <strong>{totalSeats}</strong>
              </div>
              {Object.entries(TIER_COLORS).filter(([key]) => key !== 'empty').map(([tier, config]) => {
                const count = seatGrid.flat().filter(s => s.tier === tier).length;
                return count > 0 ? (
                  <div key={tier} className="create-event__summary-item">
                    <span>{config.name}:</span>
                    <strong>{count} × ₹{tierPrices[tier]}</strong>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}

        <button className="btn btn-primary create-event__submit" disabled={loading || showTemplates}>
          {loading ? "Publishing..." : showTemplates ? "Select a layout first" : "Publish Event"}
        </button>
      </form>
    </div>
  );
};

export default CreateEvent;
