/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim
*/

import React, { useState, useEffect } from "react";
import axios from "axios";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";

// Data
const tableColumns = [
  { Header: "Nom", accessor: "name", align: "center" },
  { Header: "Quantité", accessor: "quantite", align: "center" },
  { Header: "Taille", accessor: "taille", align: "center" },
  { Header: "Catégorie", accessor: "categorie", align: "center" },
  { Header: "Modèle Voiture", accessor: "modelvoiture", align: "center" },
  { Header: "Voiture", accessor: "voiture", align: "center" },
  { Header: "Prix Initial", accessor: "prixinitial", align: "center" },
  { Header: "Prix Vente", accessor: "prixvente", align: "center" },
  { Header: "TVA", accessor: "tva", align: "center" },
  { Header: "Timbre", accessor: "timbre", align: "center" },
  { Header: "Actions", accessor: "actions", align: "center" },
];

const StockComponent = () => {
  const [stocks, setStocks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentStock, setCurrentStock] = useState({
    _id: "",
    stockId: 0,
    name: "",
    quantite: 1, // Default to 1 to respect min constraint
    taille: "",
    categorie: "",
    modelvoiture: "",
    voiture: "",
    prixinitial: 0,
    prixvente: 0,
    tva: 0,
    timbre: 0,
  });
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategorie, setFilterCategorie] = useState("");
  const [filterModelVoiture, setFilterModelVoiture] = useState("");
  const [filterVoiture, setFilterVoiture] = useState("");
  const [minQuantite, setMinQuantite] = useState("");
  const [maxQuantite, setMaxQuantite] = useState("");
  const [minPrix, setMinPrix] = useState("");
  const [maxPrix, setMaxPrix] = useState("");

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3000/api/stocks");
      const data = Array.isArray(res.data) ? res.data : [res.data];
      setStocks(data);
    } catch (err) {
      setError(err.response?.data?.message || "Échec de la récupération des stocks.");
    } finally {
      setLoading(false);
    }
  };

  // Get unique values for dropdowns
  const uniqueCategories = [
    ...new Set(stocks.map((stock) => stock.categorie).filter(Boolean)),
  ].sort();
  const uniqueModelVoitures = [
    ...new Set(stocks.map((stock) => stock.modelvoiture).filter(Boolean)),
  ].sort();
  const uniqueVoitures = [...new Set(stocks.map((stock) => stock.voiture).filter(Boolean))].sort();

  const handleAdd = () => {
    setIsEditing(false);
    setCurrentStock({
      _id: "",
      stockId: 0,
      name: "",
      quantite: 1, // Default to 1
      taille: "",
      categorie: "",
      modelvoiture: "",
      voiture: "",
      prixinitial: 0,
      prixvente: 0,
      tva: 0,
      timbre: 0,
    });
    setError("");
    setShowModal(true);
  };

  const handleEdit = (stock) => {
    setIsEditing(true);
    setCurrentStock({
      ...stock,
      quantite: Math.max(1, Math.min(1000, stock.quantite)), // Ensure within bounds
    });
    setError("");
    setShowModal(true);
  };

  const handleView = async (stock) => {
    try {
      const res = await axios.get(`http://localhost:3000/api/stocks/${stock._id}`);
      setCurrentStock({
        ...res.data,
        quantite: Math.max(1, Math.min(1000, res.data.quantite)), // Ensure within bounds
      });
      setShowViewModal(true);
    } catch (err) {
      setError(err.response?.data?.message || "Échec de la récupération des détails.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce stock ?")) {
      try {
        await axios.delete(`http://localhost:3000/api/stocks/${id}`);
        setStocks((prev) => prev.filter((stock) => stock._id !== id));
      } catch (err) {
        setError(err.response?.data?.message || "Échec de la suppression du stock.");
        fetchStocks();
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === "quantite") {
      newValue = value === "" ? 1 : Math.max(1, Math.min(1000, Number(value))); // Enforce min=1, max=1000
    } else if (["prixinitial", "prixvente", "tva", "timbre"].includes(name)) {
      newValue = value === "" ? 0 : Number(value);
    }
    setCurrentStock((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { _id, stockId, ...payload } = currentStock;

    if (!payload.name || !payload.quantite || !payload.prixinitial || !payload.prixvente) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (payload.quantite < 1 || payload.quantite > 1000) {
      setError("La quantité doit être entre 1 et 1000.");
      return;
    }

    if (payload.prixinitial <= 0 || payload.prixvente <= 0) {
      setError("Prix Initial et Prix Vente doivent être supérieurs à 0.");
      return;
    }

    if (payload.tva < 0 || payload.timbre < 0) {
      setError("TVA et Timbre ne peuvent pas être négatifs.");
      return;
    }

    try {
      let response;
      if (isEditing) {
        response = await axios.put(`http://localhost:3000/api/stocks/${_id}`, payload);
      } else {
        response = await axios.post("http://localhost:3000/api/stocks/", payload);
        setStocks((prev) => [...prev, response.data]);
      }
      fetchStocks();
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || "Échec de l'enregistrement.");
      fetchStocks();
    }
  };

  // Filter stocks based on search criteria
  const filteredStocks = stocks.filter((stock) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = query
      ? stock.name.toLowerCase().includes(query) ||
        (stock.taille?.toLowerCase().includes(query) ?? false) ||
        (stock.categorie?.toLowerCase().includes(query) ?? false) ||
        (stock.modelvoiture?.toLowerCase().includes(query) ?? false) ||
        (stock.voiture?.toLowerCase().includes(query) ?? false) ||
        stock.quantite.toString().includes(query) ||
        stock.prixinitial.toString().includes(query) ||
        stock.prixvente.toString().includes(query) ||
        stock.tva.toString().includes(query) ||
        stock.timbre.toString().includes(query)
      : true;
    const matchesCategorie = filterCategorie ? stock.categorie === filterCategorie : true;
    const matchesModelVoiture = filterModelVoiture
      ? stock.modelvoiture === filterModelVoiture
      : true;
    const matchesVoiture = filterVoiture ? stock.voiture === filterVoiture : true;
    const matchesMinQuantite = minQuantite ? stock.quantite >= Number(minQuantite) : true;
    const matchesMaxQuantite = maxQuantite ? stock.quantite <= Number(maxQuantite) : true;
    const matchesMinPrix = minPrix ? stock.prixvente >= Number(minPrix) : true;
    const matchesMaxPrix = maxPrix ? stock.prixvente <= Number(maxPrix) : true;

    return (
      matchesSearch &&
      matchesCategorie &&
      matchesModelVoiture &&
      matchesVoiture &&
      matchesMinQuantite &&
      matchesMaxQuantite &&
      matchesMinPrix &&
      matchesMaxPrix
    );
  });

  const tableRows = filteredStocks.map((stock) => ({
    stockId: stock.stockId || "N/A",
    name: stock.name || "N/A",
    quantite: stock.quantite || 0,
    taille: stock.taille || "N/A",
    categorie: stock.categorie || "N/A",
    modelvoiture: stock.modelvoiture || "N/A",
    voiture: stock.voiture || "N/A",
    prixinitial: `${(stock.prixinitial || 0).toFixed(2)} DT`,
    prixvente: `${(stock.prixvente || 0).toFixed(2)} DT`,
    tva: `${(stock.tva || 0).toFixed(2)} DT`,
    timbre: `${(stock.timbre || 0).toFixed(2)} DT`,
    actions: (
      <MDBox display="flex" justifyContent="center" alignItems="center" gap={1}>
        <IconButton
          color="info"
          onClick={() => handleView(stock)}
          disabled={!stock._id}
          aria-label="Voir les détails"
        >
          <Icon>visibility</Icon>
        </IconButton>
        <IconButton
          color="warning"
          onClick={() => handleEdit(stock)}
          disabled={!stock._id}
          aria-label="Modifier"
        >
          <Icon>edit</Icon>
        </IconButton>
        <IconButton
          color="error"
          onClick={() => handleDelete(stock._id)}
          disabled={!stock._id}
          aria-label="Supprimer"
        >
          <Icon>delete</Icon>
        </IconButton>
      </MDBox>
    ),
  }));

  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "80%",
    maxWidth: "600px",
    bgcolor: "background.paper",
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterCategorie("");
    setFilterModelVoiture("");
    setFilterVoiture("");
    setMinQuantite("");
    setMaxQuantite("");
    setMinPrix("");
    setMaxPrix("");
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <MDTypography variant="h4" fontWeight="medium">
                  Gestion des Stocks
                </MDTypography>
                <MDBox>
                  <MDButton
                    variant="gradient"
                    color="info"
                    onClick={handleAdd}
                    aria-label="Ajouter un nouveau stock"
                  >
                    <Icon>add</Icon> Nouvel Article
                  </MDButton>
                </MDBox>
              </MDBox>

              {/* Filter Inputs */}
              <MDBox mb={3}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={3}>
                    <MDTypography variant="body2" fontWeight="bold" mb={1}>
                      Recherche
                    </MDTypography>
                    <TextField
                      fullWidth
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher dans toutes les colonnes"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <MDTypography variant="body2" fontWeight="bold" mb={1}>
                      Catégorie
                    </MDTypography>
                    <Select
                      fullWidth
                      value={filterCategorie}
                      onChange={(e) => setFilterCategorie(e.target.value)}
                      displayEmpty
                      variant="outlined"
                    >
                      <MenuItem value="">Toutes</MenuItem>
                      {uniqueCategories.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <MDTypography variant="body2" fontWeight="bold" mb={1}>
                      Modèle Voiture
                    </MDTypography>
                    <Select
                      fullWidth
                      value={filterModelVoiture}
                      onChange={(e) => setFilterModelVoiture(e.target.value)}
                      displayEmpty
                      variant="outlined"
                    >
                      <MenuItem value="">Toutes</MenuItem>
                      {uniqueModelVoitures.map((model) => (
                        <MenuItem key={model} value={model}>
                          {model}
                        </MenuItem>
                      ))}
                    </Select>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <MDTypography variant="body2" fontWeight="bold" mb={1}>
                      Voiture
                    </MDTypography>
                    <Select
                      fullWidth
                      value={filterVoiture}
                      onChange={(e) => setFilterVoiture(e.target.value)}
                      displayEmpty
                      variant="outlined"
                    >
                      <MenuItem value="">Toutes</MenuItem>
                      {uniqueVoitures.map((voiture) => (
                        <MenuItem key={voiture} value={voiture}>
                          {voiture}
                        </MenuItem>
                      ))}
                    </Select>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <MDTypography variant="body2" fontWeight="bold" mb={1}>
                      Quantité Min
                    </MDTypography>
                    <TextField
                      fullWidth
                      type="number"
                      value={minQuantite}
                      onChange={(e) => setMinQuantite(e.target.value)}
                      variant="outlined"
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <MDTypography variant="body2" fontWeight="bold" mb={1}>
                      Quantité Max
                    </MDTypography>
                    <TextField
                      fullWidth
                      type="number"
                      value={maxQuantite}
                      onChange={(e) => setMaxQuantite(e.target.value)}
                      variant="outlined"
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <MDTypography variant="body2" fontWeight="bold" mb={1}>
                      Prix Min (DT)
                    </MDTypography>
                    <TextField
                      fullWidth
                      type="number"
                      value={minPrix}
                      onChange={(e) => setMinPrix(e.target.value)}
                      variant="outlined"
                      inputProps={{ min: 0, step: "0.01" }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <MDTypography variant="body2" fontWeight="bold" mb={1}>
                      Prix Max (DT)
                    </MDTypography>
                    <TextField
                      fullWidth
                      type="number"
                      value={maxPrix}
                      onChange={(e) => setMaxPrix(e.target.value)}
                      variant="outlined"
                      inputProps={{ min: 0, step: "0.01" }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <MDButton variant="outlined" color="secondary" onClick={handleClearFilters}>
                      Effacer les filtres
                    </MDButton>
                  </Grid>
                </Grid>
              </MDBox>

              {error && (
                <MDBox mb={2}>
                  <MDTypography variant="body2" color="error">
                    {error}
                  </MDTypography>
                </MDBox>
              )}
              {loading ? (
                <MDBox display="flex" justifyContent="center" alignItems="center" py={3}>
                  <MDTypography variant="body2">Chargement...</MDTypography>
                </MDBox>
              ) : (
                <DataTable
                  table={{ columns: tableColumns, rows: tableRows }}
                  isSorted={false}
                  entriesPerPage={false}
                  showTotalEntries={true}
                  noEndBorder
                />
              )}
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>

      {/* Add/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <MDBox sx={modalStyle}>
          <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <MDTypography variant="h5" id="stockModalLabel">
              {isEditing ? "Modifier un article" : "Ajouter un nouvel article"}
            </MDTypography>
            <IconButton onClick={() => setShowModal(false)} aria-label="Fermer">
              <Icon>close</Icon>
            </IconButton>
          </MDBox>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {[
                { label: "Nom", name: "name", type: "text" },
                { label: "Quantité", name: "quantite", type: "number", min: 1, max: 1000 },
                { label: "Taille", name: "taille", type: "text" },
                { label: "Catégorie", name: "categorie", type: "text" },
                { label: "Modèle Voiture", name: "modelvoiture", type: "text" },
                { label: "Voiture", name: "voiture", type: "text" },
                {
                  label: "Prix Initial (DT)",
                  name: "prixinitial",
                  type: "number",
                  min: 0.01,
                  step: "0.01",
                },
                {
                  label: "Prix Vente (DT)",
                  name: "prixvente",
                  type: "number",
                  min: 0.01,
                  step: "0.01",
                },
                {
                  label: "TVA (%)",
                  name: "tva",
                  type: "number",
                  min: 0,
                  max: 100,
                  step: "0.01",
                },
                {
                  label: "Timbre (DT)",
                  name: "timbre",
                  type: "number",
                  min: 0,
                  step: "0.01",
                },
              ].map(({ label, name, type, min, max, step }) => (
                <Grid item xs={6} key={name}>
                  <MDTypography variant="body2" fontWeight="bold" mb={1}>
                    {label} {type !== "text" && <span style={{ color: "red" }}>*</span>}
                  </MDTypography>
                  <TextField
                    fullWidth
                    type={type}
                    id={name}
                    name={name}
                    value={currentStock[name] ?? ""}
                    onChange={handleInputChange}
                    variant="outlined"
                    required={type !== "text"}
                    inputProps={{ min, max, step }}
                    aria-required={type !== "text"}
                    aria-describedby={`${name}-error`}
                  />
                </Grid>
              ))}
            </Grid>
            {error && (
              <MDBox mt={2}>
                <MDTypography variant="body2" color="error">
                  {error}
                </MDTypography>
              </MDBox>
            )}
            <MDBox mt={3} display="flex" justifyContent="flex-end" gap={2}>
              <MDButton variant="outlined" color="secondary" onClick={() => setShowModal(false)}>
                Annuler
              </MDButton>
              <MDButton variant="gradient" color="info" type="submit">
                {isEditing ? "Mettre à jour" : "Enregistrer"}
              </MDButton>
            </MDBox>
          </form>
        </MDBox>
      </Modal>

      {/* View Modal */}
      <Modal open={showViewModal} onClose={() => setShowViewModal(false)}>
        <MDBox sx={modalStyle}>
          <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <MDTypography variant="h5" id="viewModalLabel">
              Détails des article
            </MDTypography>
            <IconButton onClick={() => setShowViewModal(false)} aria-label="Fermer">
              <Icon>close</Icon>
            </IconButton>
          </MDBox>
          <Grid container spacing={2}>
            {[
              { label: "Nom", value: currentStock.name },
              { label: "Quantité", value: currentStock.quantite },
              { label: "Taille", value: currentStock.taille },
              { label: "Catégorie", value: currentStock.categorie },
              { label: "Modèle Voiture", value: currentStock.modelvoiture },
              { label: "Voiture", value: currentStock.voiture },
              {
                label: "Prix Initial (DT)",
                value: Number(currentStock.prixinitial || 0).toFixed(2),
              },
              {
                label: "Prix Vente (DT)",
                value: Number(currentStock.prixvente || 0).toFixed(2),
              },
              { label: "TVA (%)", value: Number(currentStock.tva || 0).toFixed(2) },
              { label: "Timbre (DT)", value: Number(currentStock.timbre || 0).toFixed(2) },
            ].map(({ label, value }) => (
              <Grid item xs={6} key={label}>
                <MDTypography variant="body2" fontWeight="bold" mb={1}>
                  {label}
                </MDTypography>
                <TextField
                  fullWidth
                  value={value ?? "N/A"}
                  variant="outlined"
                  InputProps={{ readOnly: true }}
                  aria-readonly="true"
                />
              </Grid>
            ))}
          </Grid>
          <MDBox mt={3} display="flex" justifyContent="flex-end">
            <MDButton variant="outlined" color="secondary" onClick={() => setShowViewModal(false)}>
              Fermer
            </MDButton>
          </MDBox>
        </MDBox>
      </Modal>

      <Footer />
    </DashboardLayout>
  );
};

export default StockComponent;
