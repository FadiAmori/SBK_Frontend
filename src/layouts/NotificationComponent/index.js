/* eslint-disable react/jsx-no-undef */
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
import MDTypography from "components/MDTypography";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import DataTable from "examples/Tables/DataTable";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import MDButton from "components/MDButton";
// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

const tableColumns = [
  { Header: "Nom du Produit", accessor: "nomProduit", align: "center" },
  { Header: "Stock Actuel", accessor: "stockActuel", align: "center" },
  { Header: "Stock Minimal", accessor: "stockMinimal", align: "center" },
  { Header: "Actions", accessor: "actions", align: "center" },
];

const NotificationComponent = () => {
  const [produits, setProduits] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentProduit, setCurrentProduit] = useState({
    _id: "",
    referenceProduit: "",
    nomProduit: "",
    categorie: "",
    description: "",
    prixUnitaireHT: 0,
    tvaApplicable: 0,
    stockActuel: 0,
    stockMinimal: 0,
    seuilReapprovisionnement: 0,
    fournisseurPrincipal: "",
    quantite: 0,
    stockAvantMouvement: 0,
    stockApresMouvement: 0,
    recherche: "",
    rechercheCorrespondance: "",
  });

  useEffect(() => {
    fetchProduits();
    fetchFournisseurs();
  }, []);

  const fetchProduits = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`https://sbk-1.onrender.com/api/produits`);
      const data = Array.isArray(res.data) ? res.data : [res.data];
      // Filter products where stockActuel <= stockMinimal
      const lowStockProducts = data.filter(
        (produit) => (produit.stockActuel || 0) <= (produit.stockMinimal || 0)
      );
      setProduits(lowStockProducts);
    } catch (err) {
      setError(err.response?.data?.error || "Échec de la récupération des produits.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFournisseurs = async () => {
    try {
      const res = await axios.get(`https://sbk-1.onrender.com/api/fournisseurs`);
      setFournisseurs(Array.isArray(res.data) ? res.data : [res.data]);
    } catch (err) {
      setError(err.response?.data?.error || "Échec de la récupération des fournisseurs.");
    }
  };

  const handleView = async (produit) => {
    try {
      const res = await axios.get(`https://sbk-1.onrender.com/api/produits/${produit._id}`);
      setCurrentProduit({
        ...res.data,
        recherche: res.data.recherche?.join(", ") || "",
        rechercheCorrespondance: res.data.rechercheCorrespondance?.join(", ") || "",
        stockActuel: Math.max(0, res.data.stockActuel),
        stockMinimal: Math.max(0, res.data.stockMinimal),
        seuilReapprovisionnement: Math.max(0, res.data.seuilReapprovisionnement),
        quantite: Math.max(0, res.data.quantite || 0),
      });
      setShowViewModal(true);
    } catch (err) {
      setError(err.response?.data?.error || "Échec de la récupération des détails.");
    }
  };

  const tableRows = produits.map((produit) => ({
    nomProduit: produit.nomProduit || "N/A",
    stockActuel: produit.stockActuel || 0,
    stockMinimal: produit.stockMinimal || 0,
    actions: (
      <MDBox display="flex" justifyContent="center" alignItems="center" gap={1}>
        <IconButton
          color="info"
          onClick={() => handleView(produit)}
          disabled={!produit._id}
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
                  Notifications de Stock Faible
                </MDTypography>
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
              ) : produits.length > 0 ? (
                <DataTable
                  table={{ columns: tableColumns, rows: tableRows }}
                  isSorted={false}
                  entriesPerPage={false}
                  showTotalEntries={true}
                  noEndBorder
                />
              ) : (
                <MDTypography variant="body2" color="text.secondary" textAlign="center">
                  Aucun produit avec un stock inférieur ou égal au stock minimal.
                </MDTypography>
              )}
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>

      {/* View Modal */}
      <Modal open={showViewModal} onClose={() => setShowViewModal(false)}>
        <MDBox sx={modalStyle}>
          <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <MDTypography variant="h5" id="viewModalLabel">
              Détails du Produit
            </MDTypography>
            <IconButton onClick={() => setShowViewModal(false)} aria-label="Fermer">
              <Icon>close</Icon>
            </IconButton>
          </MDBox>
          <Grid container spacing={2}>
            {[
              { label: "Référence Produit", value: currentProduit.referenceProduit },
              { label: "Nom du Produit", value: currentProduit.nomProduit },
              { label: "Catégorie", value: currentProduit.categorie },
              { label: "Description", value: currentProduit.description },
              {
                label: "Prix Unitaire HT (DT)",
                value: Number(currentProduit.prixUnitaireHT || 0).toFixed(2),
              },
              {
                label: "TVA Applicable (%)",
                value: Number(currentProduit.tvaApplicable || 0).toFixed(2),
              },
              { label: "Stock Actuel", value: currentProduit.stockActuel },
              { label: "Stock Minimal", value: currentProduit.stockMinimal },
              {
                label: "Seuil de Réapprovisionnement",
                value: currentProduit.seuilReapprovisionnement,
              },
              { label: "Quantité", value: currentProduit.quantite },
              { label: "Stock Avant Mouvement", value: currentProduit.stockAvantMouvement },
              { label: "Stock Après Mouvement", value: currentProduit.stockApresMouvement },
              { label: "Recherche", value: currentProduit.recherche },
              { label: "Recherche Correspondance", value: currentProduit.rechercheCorrespondance },
              {
                label: "Fournisseur Principal",
                value:
                  fournisseurs.find((f) => f._id === currentProduit.fournisseurPrincipal)
                    ?.nomRaisonSociale || "N/A",
              },
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

export default NotificationComponent;
