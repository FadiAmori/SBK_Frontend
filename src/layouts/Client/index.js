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
  { Header: "N° Client", accessor: "numeroClient", align: "center" },
  { Header: "Nom/Raison Sociale", accessor: "nomRaisonSociale", align: "center" },
  { Header: "Adresse", accessor: "adresse", align: "center" },
  { Header: "Téléphone", accessor: "telephone", align: "center" },
  { Header: "Email", accessor: "email", align: "center" },
  { Header: "Type Client", accessor: "typeClient", align: "center" },
  { Header: "Actions", accessor: "actions", align: "center" },
];

const ClientComponent = () => {
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentClient, setCurrentClient] = useState({
    _id: "",
    numeroClient: "",
    nomRaisonSociale: "",
    adresse: "",
    telephone: "",
    email: "",
    dateInscription: "",
    typeClient: "",
    conditionsPaiement: "",
    historiqueAchats: 0,
    remisesConditionsSpeciales: "",
    recherche: "",
  });
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTypeClient, setFilterTypeClient] = useState("");

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://sbk-1.onrender.com/api/clients");
      const data = Array.isArray(res.data) ? res.data : [res.data];
      setClients(data);
    } catch (err) {
      setError(err.response?.data?.error || "Échec de la récupération des clients.");
    } finally {
      setLoading(false);
    }
  };

  // Get unique values for dropdowns
  const uniqueTypes = [
    ...new Set(clients.map((client) => client.typeClient).filter(Boolean)),
  ].sort();

  const handleAdd = () => {
    setIsEditing(false);
    setCurrentClient({
      _id: "",
      numeroClient: "", // Ignored by backend
      nomRaisonSociale: "",
      adresse: "",
      telephone: "",
      email: "",
      dateInscription: "",
      typeClient: "",
      conditionsPaiement: "",
      historiqueAchats: 0,
      remisesConditionsSpeciales: "",
      recherche: "",
    });
    setError("");
    setShowModal(true);
  };

  const handleEdit = (client) => {
    setIsEditing(true);
    setCurrentClient({
      ...client,
      recherche: client.recherche?.join(", ") || "",
      dateInscription: client.dateInscription
        ? new Date(client.dateInscription).toISOString().split("T")[0]
        : "",
      historiqueAchats: Math.max(0, client.historiqueAchats || 0),
    });
    setError("");
    setShowModal(true);
  };

  const handleView = async (client) => {
    try {
      const res = await axios.get(`https://sbk-1.onrender.com/api/clients/${client._id}`);
      setCurrentClient({
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
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      try {
        await axios.delete(`https://sbk-1.onrender.com/api/clients/${id}`);
        setClients((prev) => prev.filter((client) => client._id !== id));
      } catch (err) {
        setError(err.response?.data?.error || "Échec de la suppression du client.");
        fetchClients();
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === "historiqueAchats") {
      newValue = value === "" ? 0 : Math.max(0, Number(value));
    }
    setCurrentClient((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { _id, numeroClient, dateInscription, recherche, ...payload } = currentClient;

    // Convert comma-separated recherche to array
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
        response = await axios.put(`https://sbk-1.onrender.com/api/clients/${_id}`, payload);
      } else {
        response = await axios.post("https://sbk-1.onrender.com/api/clients", payload);
        setClients((prev) => [...prev, response.data]);
      }
      fetchClients();
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.error || "Échec de l'enregistrement.");
      fetchClients();
    }
  };

  // Filter clients based on search criteria
  const filteredClients = clients.filter((client) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = query
      ? client.numeroClient.toLowerCase().includes(query) ||
        client.nomRaisonSociale.toLowerCase().includes(query) ||
        (client.adresse?.toLowerCase().includes(query) ?? false) ||
        (client.telephone?.toLowerCase().includes(query) ?? false) ||
        (client.email?.toLowerCase().includes(query) ?? false) ||
        client.recherche?.some((term) => term.toLowerCase().includes(query))
      : true;
    const matchesType = filterTypeClient ? client.typeClient === filterTypeClient : true;

    return matchesSearch && matchesType;
  });

  const tableRows = filteredClients.map((client) => ({
    numeroClient: client.numeroClient || "N/A",
    nomRaisonSociale: client.nomRaisonSociale || "N/A",
    adresse: client.adresse || "N/A",
    telephone: client.telephone || "N/A",
    email: client.email || "N/A",
    typeClient: client.typeClient || "N/A",
    actions: (
      <MDBox display="flex" justifyContent="center" alignItems="center" gap={1}>
        <IconButton
          color="info"
          onClick={() => handleView(client)}
          disabled={!client._id}
          aria-label="Voir les détails"
        >
          <Icon>visibility</Icon>
        </IconButton>
        <IconButton
          color="warning"
          onClick={() => handleEdit(client)}
          disabled={!client._id}
          aria-label="Modifier"
        >
          <Icon>edit</Icon>
        </IconButton>
        <IconButton
          color="error"
          onClick={() => handleDelete(client._id)}
          disabled={!client._id}
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
    setFilterTypeClient("");
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
                  Gestion des Clients
                </MDTypography>
                <MDBox>
                  <MDButton
                    variant="gradient"
                    color="info"
                    onClick={handleAdd}
                    aria-label="Ajouter un nouveau client"
                  >
                    <Icon>add</Icon> Nouveau Client
                  </MDButton>
                </MDBox>
              </MDBox>

              {/* Filter Inputs */}
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
                      Type Client
                    </MDTypography>
                    <Select
                      fullWidth
                      value={filterTypeClient}
                      onChange={(e) => setFilterTypeClient(e.target.value)}
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

      {/* Add/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <MDBox sx={modalStyle}>
          <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <MDTypography variant="h5" id="clientModalLabel">
              {isEditing ? "Modifier un client" : "Ajouter un nouveau client"}
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
                { label: "Conditions de Paiement", name: "conditionsPaiement", type: "text" },
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
                    value={currentClient[name] ?? ""}
                    onChange={handleInputChange}
                    variant="outlined"
                    required={required}
                    inputProps={{ min }}
                    aria-required={required}
                    aria-describedby={`${name}-error`}
                  />
                </Grid>
              ))}
              <Grid item xs={6}>
                <MDTypography variant="body2" fontWeight="bold" mb={1}>
                  Type Client
                </MDTypography>
                <Select
                  fullWidth
                  name="typeClient"
                  value={currentClient.typeClient || ""}
                  onChange={handleInputChange}
                  variant="outlined"
                  displayEmpty
                >
                  <MenuItem value="">Aucun</MenuItem>
                  {["Particulier", "Entreprise", "Distributeur"].map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
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

      {/* View Modal */}
      <Modal open={showViewModal} onClose={() => setShowViewModal(false)}>
        <MDBox sx={modalStyle}>
          <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <MDTypography variant="h5" id="viewModalLabel">
              Détails du Client
            </MDTypography>
            <IconButton onClick={() => setShowViewModal(false)} aria-label="Fermer">
              <Icon>close</Icon>
            </IconButton>
          </MDBox>
          <Grid container spacing={2}>
            {[
              { label: "N° Client", value: currentClient.numeroClient },
              { label: "Nom/Raison Sociale", value: currentClient.nomRaisonSociale },
              { label: "Adresse", value: currentClient.adresse },
              { label: "Téléphone", value: currentClient.telephone },
              { label: "Email", value: currentClient.email },
              {
                label: "Date d'Inscription",
                value: currentClient.dateInscription
                  ? new Date(currentClient.dateInscription).toLocaleDateString()
                  : "N/A",
              },
              { label: "Type Client", value: currentClient.typeClient },
              { label: "Conditions de Paiement", value: currentClient.conditionsPaiement },
              { label: "Historique des Achats", value: currentClient.historiqueAchats },
              {
                label: "Remises/Conditions Spéciales",
                value: currentClient.remisesConditionsSpeciales,
              },
              { label: "Recherche", value: currentClient.recherche },
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

export default ClientComponent;
