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
  { Header: "N° Fournisseur", accessor: "numeroFournisseur", align: "center" },
  { Header: "Nom/Raison Sociale", accessor: "nomRaisonSociale", align: "center" },
  { Header: "Adresse", accessor: "adresse", align: "center" },
  { Header: "Téléphone", accessor: "telephone", align: "center" },
  { Header: "Email", accessor: "email", align: "center" },
  { Header: "Type Fournisseur", accessor: "typeFournisseur", align: "center" },
  { Header: "Actions", accessor: "actions", align: "center" },
];

const FournisseurComponent = () => {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentFournisseur, setCurrentFournisseur] = useState({
    _id: "",
    numeroFournisseur: "",
    nomRaisonSociale: "",
    adresse: "",
    telephone: "",
    email: "",
    dateInscription: "",
    nomContact: "",
    typeFournisseur: "",
    delaiPaiement: "",
    modePaiement: "",
    compteBancaire: "",
    historiqueAchats: 0,
    remisesConditionsSpeciales: "",
    recherche: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTypeFournisseur, setFilterTypeFournisseur] = useState("");

  useEffect(() => {
    fetchFournisseurs();
  }, []);

  const fetchFournisseurs = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://sbk-1.onrender.com/api/fournisseurs");
      const data = Array.isArray(res.data) ? res.data : [res.data];
      setFournisseurs(data);
    } catch (err) {
      setError(err.response?.data?.error || "Échec de la récupération des fournisseurs.");
    } finally {
      setLoading(false);
    }
  };

  const uniqueTypes = [
    ...new Set(fournisseurs.map((fournisseur) => fournisseur.typeFournisseur).filter(Boolean)),
  ].sort();

  const handleAdd = () => {
    setIsEditing(false);
    setCurrentFournisseur({
      _id: "",
      numeroFournisseur: "", // Ignored by backend
      nomRaisonSociale: "",
      adresse: "",
      telephone: "",
      email: "",
      dateInscription: new Date().toISOString().split("T")[0],
      nomContact: "",
      typeFournisseur: "",
      delaiPaiement: "",
      modePaiement: "",
      compteBancaire: "",
      historiqueAchats: 0,
      remisesConditionsSpeciales: "",
      recherche: "",
    });
    setError("");
    setShowModal(true);
  };

  const handleEdit = (fournisseur) => {
    setIsEditing(true);
    setCurrentFournisseur({
      ...fournisseur,
      recherche: fournisseur.recherche?.join(", ") || "",
      dateInscription: fournisseur.dateInscription
        ? new Date(fournisseur.dateInscription).toISOString().split("T")[0]
        : "",
      historiqueAchats: Math.max(0, fournisseur.historiqueAchats || 0),
    });
    setError("");
    setShowModal(true);
  };

  const handleView = async (fournisseur) => {
    try {
      const res = await axios.get(`https://sbk-1.onrender.com/api/fournisseurs/${fournisseur._id}`);
      setCurrentFournisseur({
        ...res.data,
        recherche: res.data.recherche?.join(", ") || "",
        dateInscription: res.data.dateInscription
          ? new Date(res.data.dateInscription).toISOString().split("T")[0]
          : "",
        historiqueAchats: Math.max(0, res.data.historiqueAchats || 0),
      });
      setShowViewModal(true);
    } catch (err) {
      setError(err.response?.data?.error || "Échec de la récupération des détails.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce fournisseur ?")) {
      try {
        await axios.delete(`https://sbk-1.onrender.com/api/fournisseurs/${id}`);
        setFournisseurs((prev) => prev.filter((fournisseur) => fournisseur._id !== id));
      } catch (err) {
        setError(err.response?.data?.error || "Échec de la suppression du fournisseur.");
        fetchFournisseurs();
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === "historiqueAchats") {
      newValue = value === "" ? 0 : Math.max(0, Number(value));
    }
    setCurrentFournisseur((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { _id, numeroFournisseur, recherche, ...payload } = currentFournisseur;

    payload.recherche = recherche
      ? recherche
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    if (!payload.nomRaisonSociale || !payload.adresse) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    try {
      let response;
      if (isEditing) {
        response = await axios.put(`https://sbk-1.onrender.com/api/fournisseurs/${_id}`, payload);
      } else {
        response = await axios.post("https://sbk-1.onrender.com/api/fournisseurs", payload);
      }
      fetchFournisseurs();
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.error || "Échec de l'enregistrement.");
      fetchFournisseurs();
    }
  };

  const filteredFournisseurs = fournisseurs.filter((fournisseur) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = query
      ? fournisseur.numeroFournisseur.toLowerCase().includes(query) ||
        fournisseur.nomRaisonSociale.toLowerCase().includes(query) ||
        (fournisseur.adresse?.toLowerCase().includes(query) ?? false) ||
        (fournisseur.telephone?.toLowerCase().includes(query) ?? false) ||
        (fournisseur.email?.toLowerCase().includes(query) ?? false) ||
        (fournisseur.nomContact?.toLowerCase().includes(query) ?? false) ||
        fournisseur.recherche?.some((term) => term.toLowerCase().includes(query))
      : true;
    const matchesType = filterTypeFournisseur
      ? fournisseur.typeFournisseur === filterTypeFournisseur
      : true;

    return matchesSearch && matchesType;
  });

  const tableRows = filteredFournisseurs.map((fournisseur) => ({
    numeroFournisseur: fournisseur.numeroFournisseur || "N/A",
    nomRaisonSociale: fournisseur.nomRaisonSociale || "N/A",
    adresse: fournisseur.adresse || "N/A",
    telephone: fournisseur.telephone || "N/A",
    email: fournisseur.email || "N/A",
    typeFournisseur: fournisseur.typeFournisseur || "N/A",
    actions: (
      <MDBox display="flex" justifyContent="center" alignItems="center" gap={1}>
        <IconButton
          color="info"
          onClick={() => handleView(fournisseur)}
          disabled={!fournisseur._id}
          aria-label="Voir les détails"
        >
          <Icon>visibility</Icon>
        </IconButton>
        <IconButton
          color="warning"
          onClick={() => handleEdit(fournisseur)}
          disabled={!fournisseur._id}
          aria-label="Modifier"
        >
          <Icon>edit</Icon>
        </IconButton>
        <IconButton
          color="error"
          onClick={() => handleDelete(fournisseur._id)}
          disabled={!fournisseur._id}
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

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterTypeFournisseur("");
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
                  Gestion des Fournisseurs
                </MDTypography>
                <MDBox>
                  <MDButton
                    variant="gradient"
                    color="info"
                    onClick={handleAdd}
                    aria-label="Ajouter un nouveau fournisseur"
                  >
                    <Icon>add</Icon> Nouveau Fournisseur
                  </MDButton>
                </MDBox>
              </MDBox>

              <MDBox mb={3}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <MDTypography variant="body2" fontWeight="bold" mb={1}>
                      Recherche
                    </MDTypography>
                    <TextField
                      fullWidth
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher (numéro, nom, adresse, etc.)"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MDTypography variant="body2" fontWeight="bold" mb={1}>
                      Type Fournisseur
                    </MDTypography>
                    <Select
                      fullWidth
                      value={filterTypeFournisseur}
                      onChange={(e) => setFilterTypeFournisseur(e.target.value)}
                      displayEmpty
                      variant="outlined"
                    >
                      <MenuItem value="">Tous</MenuItem>
                      {uniqueTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
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

      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <MDBox sx={modalStyle}>
          <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <MDTypography variant="h5" id="fournisseurModalLabel">
              {isEditing ? "Modifier un fournisseur" : "Ajouter un nouveau fournisseur"}
            </MDTypography>
            <IconButton onClick={() => setShowModal(false)} aria-label="Fermer">
              <Icon>close</Icon>
            </IconButton>
          </MDBox>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {[
                {
                  label: "Nom/Raison Sociale",
                  name: "nomRaisonSociale",
                  type: "text",
                  required: true,
                },
                { label: "Adresse", name: "adresse", type: "text", required: true },
                { label: "Téléphone", name: "telephone", type: "text" },
                { label: "Email", name: "email", type: "email" },
                { label: "Date d'Inscription", name: "dateInscription", type: "date" },
                { label: "Nom du Contact", name: "nomContact", type: "text" },
                { label: "Délai de Paiement", name: "delaiPaiement", type: "text" },
                { label: "Compte Bancaire", name: "compteBancaire", type: "text" },
                {
                  label: "Historique des Achats",
                  name: "historiqueAchats",
                  type: "number",
                  min: 0,
                },
                {
                  label: "Remises/Conditions Spéciales",
                  name: "remisesConditionsSpeciales",
                  type: "text",
                },
                { label: "Recherche (séparé par virgules)", name: "recherche", type: "text" },
              ].map(({ label, name, type, min, required }) => (
                <Grid item xs={6} key={name}>
                  <MDTypography variant="body2" fontWeight="bold" mb={1}>
                    {label} {required && <span style={{ color: "red" }}>*</span>}
                  </MDTypography>
                  <TextField
                    fullWidth
                    type={type}
                    id={name}
                    name={name}
                    value={currentFournisseur[name] ?? ""}
                    onChange={handleInputChange}
                    variant="outlined"
                    required={required}
                    inputProps={{ min }}
                    InputLabelProps={type === "date" ? { shrink: true } : {}}
                    aria-required={required}
                    aria-describedby={`${name}-error`}
                  />
                </Grid>
              ))}
              <Grid item xs={6}>
                <MDTypography variant="body2" fontWeight="bold" mb={1}>
                  Type Fournisseur
                </MDTypography>
                <Select
                  fullWidth
                  name="typeFournisseur"
                  value={currentFournisseur.typeFournisseur || ""}
                  onChange={handleInputChange}
                  variant="outlined"
                  displayEmpty
                >
                  <MenuItem value="">Aucun</MenuItem>
                  {["Produits", "Matières premières", "Services"].map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
              <Grid item xs={6}>
                <MDTypography variant="body2" fontWeight="bold" mb={1}>
                  Mode de Paiement
                </MDTypography>
                <Select
                  fullWidth
                  name="modePaiement"
                  value={currentFournisseur.modePaiement || ""}
                  onChange={handleInputChange}
                  variant="outlined"
                  displayEmpty
                >
                  <MenuItem value="">Aucun</MenuItem>
                  {["Chèque", "Virement", "Espèces"].map((mode) => (
                    <MenuItem key={mode} value={mode}>
                      {mode}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
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

      <Modal open={showViewModal} onClose={() => setShowViewModal(false)}>
        <MDBox sx={modalStyle}>
          <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <MDTypography variant="h5" id="viewModalLabel">
              Détails du Fournisseur
            </MDTypography>
            <IconButton onClick={() => setShowViewModal(false)} aria-label="Fermer">
              <Icon>close</Icon>
            </IconButton>
          </MDBox>
          <Grid container spacing={2}>
            {[
              { label: "N° Fournisseur", value: currentFournisseur.numeroFournisseur },
              { label: "Nom/Raison Sociale", value: currentFournisseur.nomRaisonSociale },
              { label: "Adresse", value: currentFournisseur.adresse },
              { label: "Téléphone", value: currentFournisseur.telephone },
              { label: "Email", value: currentFournisseur.email },
              {
                label: "Date d'Inscription",
                value: currentFournisseur.dateInscription
                  ? new Date(currentFournisseur.dateInscription).toLocaleDateString()
                  : "N/A",
              },
              { label: "Nom du Contact", value: currentFournisseur.nomContact },
              { label: "Type Fournisseur", value: currentFournisseur.typeFournisseur },
              { label: "Délai de Paiement", value: currentFournisseur.delaiPaiement },
              { label: "Mode de Paiement", value: currentFournisseur.modePaiement },
              { label: "Compte Bancaire", value: currentFournisseur.compteBancaire },
              { label: "Historique des Achats", value: currentFournisseur.historiqueAchats },
              {
                label: "Remises/Conditions Spéciales",
                value: currentFournisseur.remisesConditionsSpeciales,
              },
              { label: "Recherche", value: currentFournisseur.recherche },
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

export default FournisseurComponent;
