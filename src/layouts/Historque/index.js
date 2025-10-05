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

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";

const HistoriqueFacturesComponent = () => {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentFacture, setCurrentFacture] = useState(null);
  // Filter states
  const [filterClient, setFilterClient] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  useEffect(() => {
    const fetchFactures = async () => {
      setLoading(true);
      try {
        const response = await axios.get("http://localhost:3000/api/factures");
        const facturesData = Array.isArray(response.data) ? response.data : [response.data];
        setFactures(facturesData);
      } catch (err) {
        setError("Échec de la récupération des factures.");
        console.error("Error fetching factures:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFactures();
  }, []);

  const handleViewFacture = (facture) => {
    setCurrentFacture(facture);
    setShowViewModal(true);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilterClient("");
    setFilterStartDate("");
    setFilterEndDate("");
  };

  // Filter factures based on search criteria
  const filteredFactures = factures.filter((facture) => {
    const matchesClient = filterClient
      ? facture.client.toLowerCase().includes(filterClient.toLowerCase())
      : true;
    const factureDate = new Date(facture.datedesortie);
    const matchesStartDate = filterStartDate ? factureDate >= new Date(filterStartDate) : true;
    const matchesEndDate = filterEndDate ? factureDate <= new Date(filterEndDate) : true;

    return matchesClient && matchesStartDate && matchesEndDate;
  });

  const tableColumns = [
    { Header: "ID Facture", accessor: "_id", align: "center" },
    { Header: "Nom du Client", accessor: "client", align: "center" },
    { Header: "Adresse", accessor: "adress", align: "center" },
    { Header: "Date de Facture", accessor: "datedesortie", align: "center" },
    { Header: "Actions", accessor: "actions", align: "center" },
  ];

  const tableRows = filteredFactures.map((facture) => ({
    _id: facture._id || "N/A",
    client: facture.client || "N/A",
    adress: facture.adress || "N/A",
    datedesortie: new Date(facture.datedesortie).toLocaleDateString() || "N/A",
    actions: (
      <MDBox display="flex" justifyContent="center" alignItems="center" gap={1}>
        <IconButton
          color="info"
          onClick={() => handleViewFacture(facture)}
          aria-label="Voir les détails"
        >
          <Icon>visibility</Icon>
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

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <MDTypography variant="h4" fontWeight="medium">
                  Historique des Factures
                </MDTypography>
              </MDBox>

              {/* Filter Inputs */}
              <MDBox mb={3}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <MDTypography variant="body2" fontWeight="bold" mb={1}>
                      Client
                    </MDTypography>
                    <TextField
                      fullWidth
                      value={filterClient}
                      onChange={(e) => setFilterClient(e.target.value)}
                      placeholder="Rechercher par nom du client"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <MDTypography variant="body2" fontWeight="bold" mb={1}>
                      Date de Début
                    </MDTypography>
                    <TextField
                      fullWidth
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <MDTypography variant="body2" fontWeight="bold" mb={1}>
                      Date de Fin
                    </MDTypography>
                    <TextField
                      fullWidth
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      variant="outlined"
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

      {/* View Facture Modal */}
      <Modal open={showViewModal} onClose={() => setShowViewModal(false)}>
        <MDBox sx={modalStyle}>
          <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <MDTypography variant="h5" id="viewFactureModalLabel">
              Détails de la Facture
            </MDTypography>
            <IconButton onClick={() => setShowViewModal(false)} aria-label="Fermer">
              <Icon>close</Icon>
            </IconButton>
          </MDBox>
          {currentFacture && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <MDTypography variant="body2" fontWeight="bold" mb={1}>
                  ID Facture
                </MDTypography>
                <TextField
                  fullWidth
                  value={currentFacture._id || "N/A"}
                  variant="outlined"
                  InputProps={{ readOnly: true }}
                  aria-readonly="true"
                />
              </Grid>
              <Grid item xs={12}>
                <MDTypography variant="body2" fontWeight="bold" mb={1}>
                  Nom du Client
                </MDTypography>
                <TextField
                  fullWidth
                  value={currentFacture.client || "N/A"}
                  variant="outlined"
                  InputProps={{ readOnly: true }}
                  aria-readonly="true"
                />
              </Grid>
              <Grid item xs={12}>
                <MDTypography variant="body2" fontWeight="bold" mb={1}>
                  Adresse
                </MDTypography>
                <TextField
                  fullWidth
                  value={currentFacture.adress || "N/A"}
                  variant="outlined"
                  InputProps={{ readOnly: true }}
                  aria-readonly="true"
                />
              </Grid>
              <Grid item xs={12}>
                <MDTypography variant="body2" fontWeight="bold" mb={1}>
                  Date de Facture
                </MDTypography>
                <TextField
                  fullWidth
                  value={new Date(currentFacture.datedesortie).toLocaleDateString() || "N/A"}
                  variant="outlined"
                  InputProps={{ readOnly: true }}
                  aria-readonly="true"
                />
              </Grid>
              <Grid item xs={12}>
                <MDTypography variant="body2" fontWeight="bold" mb={1}>
                  Liste des Articles
                </MDTypography>
                <DataTable
                  table={{
                    columns: [
                      { Header: "Désignation", accessor: "designation", align: "center" },
                      { Header: "Quantité", accessor: "quantite", align: "center" },
                      { Header: "Prix Unitaire", accessor: "prixUnitaire", align: "center" },
                      { Header: "Prix Total", accessor: "prixTotal", align: "center" },
                    ],
                    rows: currentFacture.liste.map((item) => {
                      const stock = item.stock; // Populated stock object
                      const unitPrice = stock?.prixvente || 0;
                      const totalPrice = unitPrice * item.quantite;
                      return {
                        designation: stock?.name || "Unknown",
                        quantite: item.quantite || 0,
                        prixUnitaire: `${unitPrice.toFixed(2)} DT`,
                        prixTotal: `${totalPrice.toFixed(2)} DT`,
                      };
                    }),
                  }}
                  isSorted={false}
                  entriesPerPage={false}
                  showTotalEntries={false}
                  noEndBorder
                />
              </Grid>
              <Grid item xs={12}>
                <MDTypography variant="body2" fontWeight="bold" mb={1}>
                  Total T.T.C
                </MDTypography>
                <TextField
                  fullWidth
                  value={`${(currentFacture.prixtotal || 0).toFixed(2)} DT`}
                  variant="outlined"
                  InputProps={{ readOnly: true }}
                  aria-readonly="true"
                />
              </Grid>
            </Grid>
          )}
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

export default HistoriqueFacturesComponent;
