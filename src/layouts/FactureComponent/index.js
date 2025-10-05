/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";

const FactureComponent = () => {
  const [factures, setFactures] = useState([]);
  const [produits, setProduits] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [factureItems, setFactureItems] = useState([]);
  const [currentFacture, setCurrentFacture] = useState({
    _id: "",
    numeroFacture: "",
    client: "",
    dateFacturation: new Date().toISOString().split("T")[0],
    dateEcheance: "",
    modePaiement: "",
    dateReglement: "",
    statut: "En attente",
    recherche: "",
    remise: 0,
    typeFacture: "Client",
  });
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showFactureModal, setShowFactureModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newProduit, setNewProduit] = useState({
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
  });
  const [showNewProduitForm, setShowNewProduitForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatut, setFilterStatut] = useState("");

  useEffect(() => {
    Promise.all([fetchFactures(), fetchProduits(), fetchClients()]).then(() => {
      console.log("Initial data - Clients:", clients);
      console.log("Initial data - Produits:", produits);
    });
  }, []);

  const fetchFactures = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://sbk-1.onrender.com/api/factures");
      const data = Array.isArray(res.data) ? res.data : [res.data];
      setFactures(data);
    } catch (err) {
      setError(err.response?.data?.error || "Échec de la récupération des factures.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProduits = async () => {
    try {
      const res = await axios.get("https://sbk-1.onrender.com/api/produits");
      setProduits(Array.isArray(res.data) ? res.data : [res.data]);
    } catch (err) {
      setError(err.response?.data?.error || "Échec de la récupération des produits.");
    }
  };

  const fetchClients = async () => {
    try {
      const res = await axios.get("https://sbk-1.onrender.com/api/clients");
      setClients(Array.isArray(res.data) ? res.data : [res.data]);
    } catch (err) {
      setError(err.response?.data?.error || "Échec de la récupération des clients.");
    }
  };

  const handleAddNewProduit = async () => {
    if (
      !newProduit.referenceProduit ||
      !newProduit.nomProduit ||
      !newProduit.prixUnitaireHT ||
      !newProduit.tvaApplicable
    ) {
      setError("Veuillez remplir tous les champs obligatoires du produit.");
      return;
    }
    try {
      const response = await axios.post("https://sbk-1.onrender.com/api/produits", {
        ...newProduit,
        prixUnitaireHT: parseFloat(newProduit.prixUnitaireHT),
        tvaApplicable: parseFloat(newProduit.tvaApplicable),
        stockActuel: parseInt(newProduit.stockActuel) || 0,
        stockMinimal: parseInt(newProduit.stockMinimal) || 0,
        seuilReapprovisionnement: parseInt(newProduit.seuilReapprovisionnement) || 0,
        fournisseurPrincipal: newProduit.fournisseurPrincipal || null,
      });
      setProduits([...produits, response.data]);
      setSelectedProduit(response.data);
      setShowNewProduitForm(false);
      setNewProduit({
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
      });
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Échec de la création du produit.");
    }
  };

  const handleAddItem = () => {
    if (selectedProduit && quantity > 0) {
      const produit = produits.find((p) => p._id === selectedProduit._id);
      if (!produit) {
        setError("Produit non trouvé.");
        return;
      }
      if (produit.stockActuel < quantity) {
        setError(
          `Stock insuffisant pour ${produit.nomProduit}. Stock actuel: ${produit.stockActuel}`
        );
        return;
      }
      setFactureItems([
        ...factureItems,
        {
          produit: selectedProduit._id,
          quantite: quantity,
          nomProduit: produit.nomProduit || "Inconnu",
        },
      ]);
      setSelectedProduit(null);
      setQuantity(1);
      setShowAddItemModal(false);
    } else {
      setError("Veuillez sélectionner un produit et une quantité valide.");
    }
  };

  const handleDeleteItem = (index) => {
    setFactureItems(factureItems.filter((_, idx) => idx !== index));
  };

  const handleQuantityChange = (index, newQuantity) => {
    if (newQuantity < 1) return;
    const produit = produits.find((p) => p._id === factureItems[index].produit);
    if (produit && produit.stockActuel < newQuantity) {
      setError(
        `Stock insuffisant pour ${produit.nomProduit}. Stock actuel: ${produit.stockActuel}`
      );
      return;
    }
    setFactureItems(
      factureItems.map((item, idx) => (idx === index ? { ...item, quantite: newQuantity } : item))
    );
  };

  const calculateTotalHT = () => {
    const total = factureItems.reduce((total, item) => {
      const produit = produits.find((p) => p._id === item.produit);
      return total + (produit?.prixUnitaireHT || 0) * item.quantite;
    }, 0);
    const remise = parseFloat(currentFacture.remise) || 0;
    return total * (1 - remise / 100);
  };

  const calculateTVA = () => {
    const totalHT = factureItems.reduce((total, item) => {
      const produit = produits.find((p) => p._id === item.produit);
      return total + (produit?.prixUnitaireHT || 0) * item.quantite;
    }, 0);
    const remise = parseFloat(currentFacture.remise) || 0;
    const discountedHT = totalHT * (1 - remise / 100);
    return factureItems.reduce((total, item) => {
      const produit = produits.find((p) => p._id === item.produit);
      return (
        total +
        (produit?.prixUnitaireHT || 0) *
          ((produit?.tvaApplicable || 0) / 100) *
          item.quantite *
          (1 - remise / 100)
      );
    }, 0);
  };

  const calculateTotalTTC = () => {
    return calculateTotalHT() + calculateTVA();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentFacture((prev) => ({
      ...prev,
      [name]: name === "remise" ? (value === "" ? 0 : parseFloat(value) || 0) : value,
    }));
    console.log("Current Facture State:", { ...currentFacture, [name]: value }); // Debug
  };

  const handleNewProduitChange = (e) => {
    const { name, value } = e.target;
    setNewProduit((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateFacture = () => {
    setIsEditing(false);
    setCurrentFacture({
      _id: "",
      numeroFacture: "",
      client: "",
      dateFacturation: new Date().toISOString().split("T")[0],
      dateEcheance: "",
      modePaiement: "",
      dateReglement: "",
      statut: "En attente",
      recherche: "",
      remise: 0,
      typeFacture: "Client",
    });
    setFactureItems([]);
    setError("");
    setShowFactureModal(true);
  };

  const handleEditFacture = async (facture) => {
    setIsEditing(true);
    try {
      const res = await axios.get(`https://sbk-1.onrender.com/api/factures/${facture._id}`);
      setCurrentFacture({
        ...res.data,
        dateFacturation: res.data.dateFacturation
          ? new Date(res.data.dateFacturation).toISOString().split("T")[0]
          : "",
        dateEcheance: res.data.dateEcheance
          ? new Date(res.data.dateEcheance).toISOString().split("T")[0]
          : "",
        dateReglement: res.data.dateReglement
          ? new Date(res.data.dateReglement).toISOString().split("T")[0]
          : "",
        recherche: res.data.recherche?.join(", ") || "",
        client: res.data.client?._id || res.data.client || "",
        remise: Number(res.data.remise) || 0,
        typeFacture: res.data.typeFacture || "Client",
      });
      setFactureItems(
        res.data.liste?.map((item) => ({
          produit: item.produit?._id || item.produit,
          quantite: item.quantite,
          nomProduit:
            item.produit?.nomProduit ||
            produits.find((p) => p._id === (item.produit?._id || item.produit))?.nomProduit ||
            "Inconnu",
        })) || []
      );
      setError("");
      setShowFactureModal(true);
    } catch (err) {
      setError(err.response?.data?.error || "Échec de la récupération des détails.");
    }
  };

  const handleViewFacture = async (facture) => {
    try {
      const res = await axios.get(`https://sbk-1.onrender.com/api/factures/${facture._id}`);
      setCurrentFacture({
        ...res.data,
        dateFacturation: res.data.dateFacturation
          ? new Date(res.data.dateFacturation).toISOString().split("T")[0]
          : "",
        dateEcheance: res.data.dateEcheance
          ? new Date(res.data.dateEcheance).toISOString().split("T")[0]
          : "",
        dateReglement: res.data.dateReglement
          ? new Date(res.data.dateReglement).toISOString().split("T")[0]
          : "",
        recherche: res.data.recherche?.join(", ") || "",
        client: res.data.client?._id || res.data.client || "",
        remise: Number(res.data.remise) || 0,
        typeFacture: res.data.typeFacture || "Client",
      });
      setFactureItems(
        res.data.liste?.map((item) => ({
          produit: item.produit?._id || item.produit,
          quantite: item.quantite,
          nomProduit:
            item.produit?.nomProduit ||
            produits.find((p) => p._id === (item.produit?._id || item.produit))?.nomProduit ||
            "Inconnu",
        })) || []
      );
      setShowViewModal(true);
    } catch (err) {
      setError(err.response?.data?.error || "Échec de la récupération des détails.");
    }
  };

  const handleDeleteFacture = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) {
      try {
        await axios.delete(`https://sbk-1.onrender.com/api/factures/${id}`);
        setFactures((prev) => prev.filter((facture) => facture._id !== id));
      } catch (err) {
        setError(err.response?.data?.error || "Échec de la suppression de la facture.");
        fetchFactures();
      }
    }
  };

  const handleSubmitFacture = async (e) => {
    e.preventDefault();
    const { _id, numeroFacture, recherche, ...payload } = currentFacture;

    payload.recherche = recherche
      ? recherche
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    payload.montantHT = calculateTotalHT();
    payload.tva = calculateTVA();
    payload.montantTTC = calculateTotalTTC();
    payload.remise = parseFloat(currentFacture.remise) || 0;
    payload.liste = factureItems.map((item) => ({
      produit: item.produit,
      quantite: item.quantite,
    }));
    payload.typeFacture = currentFacture.typeFacture || "Client"; // Ensure it’s included

    console.log("Payload:", payload); // Debug

    if (
      !payload.client ||
      !payload.montantHT ||
      !payload.montantTTC ||
      payload.liste.length === 0 ||
      !payload.typeFacture
    ) {
      setError("Veuillez remplir tous les champs obligatoires et ajouter des articles.");
      return;
    }

    try {
      let response;
      if (isEditing) {
        response = await axios.put(`https://sbk-1.onrender.com/api/factures/${_id}`, payload);
      } else {
        response = await axios.post("https://sbk-1.onrender.com/api/factures", payload);
      }
      const populatedFacture = await axios.get(
        `https://sbk-1.onrender.com/api/factures/${response.data._id}`
      );
      generatePDF(populatedFacture.data);
      fetchFactures();
      setShowFactureModal(false);
    } catch (err) {
      console.error("Error submitting facture:", err);
      setError(err.response?.data?.error || "Échec de l'enregistrement.");
      fetchFactures();
    }
  };

  const generatePDF = (facture) => {
    try {
      if (!facture) {
        throw new Error("Facture object is null or undefined");
      }
      if (!facture.liste || !Array.isArray(facture.liste)) {
        throw new Error("Liste is missing or not an array");
      }
      if (!facture.client) {
        throw new Error("Client is missing");
      }

      const doc = new jsPDF();
      const margin = 10;
      const pageWidth = doc.internal.pageSize.width;

      doc.setFont("helvetica", "normal");
      const logoUrl = "/images/Facture3.jpg";
      const logoWidth = pageWidth - 2 * margin;
      const logoHeight = 40;
      const logoX = margin;
      const logoY = 10;

      const addHeader = () => {
        try {
          doc.addImage(logoUrl, "PNG", logoX, logoY, logoWidth, logoHeight);
        } catch (imgError) {
          console.error("Error loading image:", imgError.message);
          setError(
            `Échec du chargement de l'image: ${imgError.message}. Le PDF sera généré sans logo.`
          );
        }

        doc.setFontSize(16);
        // Dynamically set the title based on typeFacture
        const title =
          facture.typeFacture === "Bonde de Livraison"
            ? facture.typeFacture
            : `Facture ${facture.typeFacture || "N/A"}`;
        doc.text(title, pageWidth / 2, logoY + logoHeight + 10, { align: "center" });
        doc.setFontSize(12);
        doc.setFontSize(12);
        const clientData =
          typeof facture.client === "object"
            ? facture.client
            : clients.find((c) => c._id === facture.client) || {};
        doc.text(
          `Client: ${clientData.nomRaisonSociale || "N/A"}`,
          margin,
          logoY + logoHeight + 20
        );
        doc.text(
          `Numéro Facture: ${facture.numeroFacture || "N/A"}`,
          margin,
          logoY + logoHeight + 30
        );
        doc.text(`Type Facture: ${facture.typeFacture || "N/A"}`, margin, logoY + logoHeight + 40);
        doc.text(
          `Date Facturation: ${
            facture.dateFacturation
              ? new Date(facture.dateFacturation).toLocaleDateString("fr-FR")
              : "N/A"
          }`,
          pageWidth - margin,
          logoY + logoHeight + 20,
          { align: "right" }
        );
        doc.text(
          `Date Échéance: ${
            facture.dateEcheance
              ? new Date(facture.dateEcheance).toLocaleDateString("fr-FR")
              : "N/A"
          }`,
          pageWidth - margin,
          logoY + logoHeight + 30,
          { align: "right" }
        );
      };

      addHeader();

      autoTable(doc, {
        startY: logoY + logoHeight + 50,
        head: [["Quantité", "Désignation", "Prix Unitaire HT", "TVA", "Prix Total"]],
        body: facture.liste.map((item) => {
          const produit =
            item.produit && typeof item.produit === "object"
              ? item.produit
              : produits.find((p) => p._id === (item.produit?._id || item.produit)) || {};
          const unitPrice = produit.prixUnitaireHT || 0;
          const tva = produit.tvaApplicable || 0;
          const totalPrice = unitPrice * item.quantite * (1 + tva / 100);
          return [
            item.quantite || 0,
            produit.nomProduit || "Inconnu",
            `${unitPrice.toFixed(2)} DT`,
            `${tva.toFixed(2)}%`,
            `${totalPrice.toFixed(2)} DT`,
          ];
        }),
        theme: "grid",
        margin: { top: logoY + logoHeight + 50, left: margin, right: margin },
        styles: { fontSize: 10, cellPadding: 2, font: "helvetica" },
        headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
        didDrawPage: addHeader,
      });

      const itemsFinalY = doc.lastAutoTable.finalY || logoY + logoHeight + 60;
      const totalsStartY = itemsFinalY + 10;
      const totalsBody = [
        [
          "Montant HT brut",
          `${factureItems
            .reduce((total, item) => {
              const produit = produits.find((p) => p._id === item.produit);
              return total + (produit?.prixUnitaireHT || 0) * item.quantite;
            }, 0)
            .toFixed(2)} DT`,
        ],
      ];
      if (facture.remise && facture.remise > 0) {
        totalsBody.push(["Remise", `${Number(facture.remise).toFixed(2)}%`]);
        totalsBody.push(["Montant HT net", `${(facture.montantHT || 0).toFixed(2)} DT`]);
      }
      totalsBody.push(
        ["TVA", `${(facture.tva || 0).toFixed(2)} DT`],
        ["Montant TTC", `${(facture.montantTTC || 0).toFixed(2)} DT`]
      );

      autoTable(doc, {
        startY: totalsStartY,
        body: totalsBody,
        theme: "grid",
        margin: { left: margin + 70, right: margin },
        styles: { fontSize: 10, cellPadding: 2, font: "helvetica" },
      });

      const totalsFinalY = doc.lastAutoTable.finalY || totalsStartY;
      doc.text("Arrêté la présente facture à la somme de :", margin, totalsFinalY + 10);
      doc.text("(en lettres)", margin, totalsFinalY + 20);
      doc.text("Signature & Cachet", pageWidth - margin, totalsFinalY + 20, { align: "right" });

      doc.save(`facture_${facture.numeroFacture || facture._id || "unknown"}.pdf`);
    } catch (err) {
      console.error("Erreur lors de la génération du PDF:", err.message);
      setError(`Échec de la génération du PDF: ${err.message}`);
    }
  };

  const filteredFactures = factures.filter((facture) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = query
      ? facture.numeroFacture.toLowerCase().includes(query) ||
        (facture.client?.nomRaisonSociale?.toLowerCase().includes(query) ?? false) ||
        facture.recherche?.some((term) => term.toLowerCase().includes(query))
      : true;
    const matchesStatut = filterStatut ? facture.statut === filterStatut : true;
    return matchesSearch && matchesStatut;
  });

  const factureTableColumns = [
    { Header: "Numéro Facture", accessor: "numeroFacture", align: "center" },
    { Header: "Client", accessor: "client", align: "center" },
    { Header: "Date Facturation", accessor: "dateFacturation", align: "center" },
    { Header: "Montant TTC", accessor: "montantTTC", align: "center" },
    { Header: "Statut", accessor: "statut", align: "center" },
    { Header: "Type Facture", accessor: "typeFacture", align: "center" },
    { Header: "Actions", accessor: "actions", align: "center" },
  ];

  const factureTableRows = filteredFactures.map((facture) => ({
    numeroFacture: facture.numeroFacture || "N/A",
    client: facture.client?.nomRaisonSociale || "N/A",
    dateFacturation: facture.dateFacturation
      ? new Date(facture.dateFacturation).toLocaleDateString()
      : "N/A",
    montantTTC: `${(facture.montantTTC || 0).toFixed(2)} DT`,
    statut: facture.statut || "N/A",
    typeFacture: facture.typeFacture || "N/A",
    actions: (
      <MDBox display="flex" justifyContent="center" alignItems="center" gap={1}>
        <IconButton
          color="info"
          onClick={() => handleViewFacture(facture)}
          disabled={!facture._id}
          aria-label="Voir les détails"
        >
          <Icon>visibility</Icon>
        </IconButton>
        <IconButton
          color="warning"
          onClick={() => handleEditFacture(facture)}
          disabled={!facture._id}
          aria-label="Modifier"
        >
          <Icon>edit</Icon>
        </IconButton>
        <IconButton
          color="error"
          onClick={() => handleDeleteFacture(facture._id)}
          disabled={!facture._id}
          aria-label="Supprimer"
        >
          <Icon>delete</Icon>
        </IconButton>
      </MDBox>
    ),
  }));

  const itemTableColumns = [
    { Header: "Désignation", accessor: "designation", align: "center" },
    { Header: "Quantité", accessor: "quantite", align: "center" },
    { Header: "Prix Unitaire HT", accessor: "prixUnitaire", align: "center" },
    { Header: "TVA", accessor: "tva", align: "center" },
    { Header: "Prix Total", accessor: "prixTotal", align: "center" },
    { Header: "Actions", accessor: "actions", align: "center" },
  ];

  const itemTableRows = factureItems.map((item, index) => {
    const produit = produits.find((p) => p._id === item.produit);
    const unitPrice = produit?.prixUnitaireHT || 0;
    const tva = produit?.tvaApplicable || 0;
    const remise = parseFloat(currentFacture.remise) || 0;
    const totalPrice = unitPrice * item.quantite * (1 + tva / 100) * (1 - remise / 100);
    return {
      designation: produit?.nomProduit || "Inconnu",
      quantite: (
        <TextField
          type="number"
          value={item.quantite}
          onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
          variant="outlined"
          size="small"
          sx={{ width: "80px" }}
          inputProps={{ min: 1 }}
        />
      ),
      prixUnitaire: `${unitPrice.toFixed(2)} DT`,
      tva: `${tva.toFixed(2)}%`,
      prixTotal: `${totalPrice.toFixed(2)} DT`,
      actions: (
        <MDBox display="flex" justifyContent="center" alignItems="center" gap={1}>
          <IconButton color="error" onClick={() => handleDeleteItem(index)} aria-label="Supprimer">
            <Icon>delete</Icon>
          </IconButton>
        </MDBox>
      ),
    };
  });

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
    setFilterStatut("");
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
                  Gestion des Factures Clients
                </MDTypography>
                <MDBox>
                  <MDButton
                    variant="gradient"
                    color="info"
                    onClick={handleCreateFacture}
                    aria-label="Créer une facture"
                  >
                    <Icon>add</Icon> Nouvelle Facture
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
                      placeholder="Rechercher (numéro, client, etc.)"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MDTypography variant="body2" fontWeight="bold" mb={1}>
                      Statut
                    </MDTypography>
                    <Select
                      fullWidth
                      value={filterStatut}
                      onChange={(e) => setFilterStatut(e.target.value)}
                      displayEmpty
                      variant="outlined"
                    >
                      <MenuItem value="">Tous</MenuItem>
                      {["Payée", "Partiellement payée", "En attente"].map((statut) => (
                        <MenuItem key={statut} value={statut}>
                          {statut}
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
                  table={{ columns: factureTableColumns, rows: factureTableRows }}
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

      <Modal open={showFactureModal} onClose={() => setShowFactureModal(false)}>
        <MDBox sx={modalStyle}>
          <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <MDTypography variant="h5" id="factureModalLabel">
              {isEditing ? "Modifier la Facture" : "Créer une Facture"}
            </MDTypography>
            <IconButton onClick={() => setShowFactureModal(false)} aria-label="Fermer">
              <Icon>close</Icon>
            </IconButton>
          </MDBox>
          <form onSubmit={handleSubmitFacture}>
            <Grid container spacing={2}>
              {[
                {
                  label: "Date Facturation",
                  name: "dateFacturation",
                  type: "date",
                  required: true,
                },
                { label: "Date Échéance", name: "dateEcheance", type: "date" },
                { label: "Date Règlement", name: "dateReglement", type: "date" },
                { label: "Recherche (séparé par virgules)", name: "recherche", type: "text" },
                { label: "Remise (%)", name: "remise", type: "number" },
              ].map(({ label, name, type, required }) => (
                <Grid item xs={6} key={name}>
                  <MDTypography variant="body2" fontWeight="bold" mb={1}>
                    {label} {required && <span style={{ color: "red" }}>*</span>}
                  </MDTypography>
                  <TextField
                    fullWidth
                    type={type}
                    name={name}
                    value={currentFacture[name] ?? ""}
                    onChange={handleInputChange}
                    variant="outlined"
                    required={required}
                    inputProps={type === "number" ? { min: 0, step: "any" } : {}}
                    InputLabelProps={type === "date" ? { shrink: true } : {}}
                  />
                </Grid>
              ))}
              <Grid item xs={6}>
                <MDTypography variant="body2" fontWeight="bold" mb={1}>
                  Client <span style={{ color: "red" }}>*</span>
                </MDTypography>
                <Autocomplete
                  options={clients}
                  getOptionLabel={(option) =>
                    `${option.numeroClient} - ${option.nomRaisonSociale} (${
                      option.typeClient || "N/A"
                    })`
                  }
                  value={clients.find((c) => c._id === currentFacture.client) || null}
                  onChange={(event, newValue) => {
                    setCurrentFacture((prev) => ({
                      ...prev,
                      client: newValue ? newValue._id : "",
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      placeholder="Rechercher un client"
                      required
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <MDTypography variant="body2" fontWeight="bold" mb={1}>
                  Mode de Paiement
                </MDTypography>
                <Select
                  fullWidth
                  name="modePaiement"
                  value={currentFacture.modePaiement || ""}
                  onChange={handleInputChange}
                  variant="outlined"
                  displayEmpty
                >
                  <MenuItem value="">Aucun</MenuItem>
                  {["Chèque", "Virement", "Espèces", "Traite"].map((mode) => (
                    <MenuItem key={mode} value={mode}>
                      {mode}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
              <Grid item xs={6}>
                <MDTypography variant="body2" fontWeight="bold" mb={1}>
                  Statut
                </MDTypography>
                <Select
                  fullWidth
                  name="statut"
                  value={currentFacture.statut || ""}
                  onChange={handleInputChange}
                  variant="outlined"
                  displayEmpty
                >
                  {["Payée", "Partiellement payée", "En attente"].map((statut) => (
                    <MenuItem key={statut} value={statut}>
                      {statut}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
              <Grid item xs={6}>
                <MDTypography variant="body2" fontWeight="bold" mb={1}>
                  Type de Facture <span style={{ color: "red" }}>*</span>
                </MDTypography>
                <Select
                  fullWidth
                  name="typeFacture"
                  value={currentFacture.typeFacture || "Client"}
                  onChange={handleInputChange}
                  variant="outlined"
                  required
                >
                  {["BL", "Client", "Bonde de Livraison"].map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
            </Grid>
            <MDBox mt={3}>
              <MDTypography variant="h6" fontWeight="medium" mb={2}>
                Articles
              </MDTypography>
              {factureItems.length > 0 ? (
                <DataTable
                  table={{ columns: itemTableColumns, rows: itemTableRows }}
                  isSorted={false}
                  entriesPerPage={false}
                  showTotalEntries={true}
                  noEndBorder
                />
              ) : (
                <MDTypography variant="body2">Aucun article ajouté.</MDTypography>
              )}
              <MDButton
                variant="outlined"
                color="info"
                onClick={() => setShowAddItemModal(true)}
                sx={{ mt: 2 }}
              >
                Ajouter un article
              </MDButton>
              {factureItems.length > 0 && (
                <MDBox mt={2} display="flex" justifyContent="flex-end" gap={2}>
                  {Number(currentFacture.remise) > 0 && (
                    <MDTypography variant="h6" fontWeight="medium">
                      Remise: {(Number(currentFacture.remise) || 0).toFixed(2)}%
                    </MDTypography>
                  )}
                  <MDTypography variant="h6" fontWeight="medium">
                    Total TTC: {calculateTotalTTC().toFixed(2)} DT
                  </MDTypography>
                </MDBox>
              )}
            </MDBox>
            {error && (
              <MDBox mt={2}>
                <MDTypography variant="body2" color="error">
                  {error}
                </MDTypography>
              </MDBox>
            )}
            <MDBox mt={3} display="flex" justifyContent="flex-end" gap={2}>
              <MDButton
                variant="outlined"
                color="secondary"
                onClick={() => setShowFactureModal(false)}
              >
                Annuler
              </MDButton>
              <MDButton
                variant="gradient"
                color="success"
                type="submit"
                disabled={factureItems.length === 0 || !currentFacture.client}
              >
                {isEditing ? "Mettre à jour" : "Créer et Télécharger PDF"}
              </MDButton>
            </MDBox>
          </form>
        </MDBox>
      </Modal>

      <Modal open={showAddItemModal} onClose={() => setShowAddItemModal(false)}>
        <MDBox sx={modalStyle}>
          <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <MDTypography variant="h5" id="addItemModalLabel">
              Ajouter un article
            </MDTypography>
            <IconButton onClick={() => setShowAddItemModal(false)} aria-label="Fermer">
              <Icon>close</Icon>
            </IconButton>
          </MDBox>
          {!showNewProduitForm ? (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <MDTypography variant="body2" fontWeight="bold" mb={1}>
                  Sélectionner un produit <span style={{ color: "red" }}>*</span>
                </MDTypography>
                <Autocomplete
                  options={produits}
                  getOptionLabel={(option) =>
                    `${option.nomProduit} (Prix: ${option.prixUnitaireHT.toFixed(2)} DT, Stock: ${
                      option.stockActuel
                    })`
                  }
                  value={selectedProduit}
                  onChange={(event, newValue) => setSelectedProduit(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      placeholder="Rechercher un produit"
                      required
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <MDTypography variant="body2" fontWeight="bold" mb={1}>
                  Quantité <span style={{ color: "red" }}>*</span>
                </MDTypography>
                <TextField
                  fullWidth
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  variant="outlined"
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12}>
                <MDButton
                  variant="outlined"
                  color="info"
                  onClick={() => setShowNewProduitForm(true)}
                >
                  Créer un nouveau produit
                </MDButton>
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2}>
              {[
                {
                  label: "Référence Produit",
                  name: "referenceProduit",
                  type: "text",
                  required: true,
                },
                { label: "Nom Produit", name: "nomProduit", type: "text", required: true },
                { label: "Catégorie", name: "categorie", type: "text" },
                { label: "Description", name: "description", type: "text" },
                {
                  label: "Prix Unitaire HT",
                  name: "prixUnitaireHT",
                  type: "number",
                  required: true,
                },
                {
                  label: "TVA Applicable (%)",
                  name: "tvaApplicable",
                  type: "number",
                  required: true,
                },
                { label: "Stock Actuel", name: "stockActuel", type: "number" },
                { label: "Stock Minimal", name: "stockMinimal", type: "number" },
                {
                  label: "Seuil de Réapprovisionnement",
                  name: "seuilReapprovisionnement",
                  type: "number",
                },
              ].map(({ label, name, type, required }) => (
                <Grid item xs={6} key={name}>
                  <MDTypography variant="body2" fontWeight="bold" mb={1}>
                    {label} {required && <span style={{ color: "red" }}>*</span>}
                  </MDTypography>
                  <TextField
                    fullWidth
                    type={type}
                    name={name}
                    value={newProduit[name]}
                    onChange={handleNewProduitChange}
                    variant="outlined"
                    required={required}
                  />
                </Grid>
              ))}
              <Grid item xs={6}>
                <MDTypography variant="body2" fontWeight="bold" mb={1}>
                  Fournisseur Principal
                </MDTypography>
                <TextField
                  fullWidth
                  type="text"
                  name="fournisseurPrincipal"
                  value={newProduit.fournisseurPrincipal}
                  onChange={handleNewProduitChange}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          )}
          <MDBox mt={3} display="flex" justifyContent="flex-end" gap={2}>
            <MDButton
              variant="outlined"
              color="secondary"
              onClick={() => {
                setShowAddItemModal(false);
                setShowNewProduitForm(false);
              }}
            >
              Annuler
            </MDButton>
            {showNewProduitForm ? (
              <MDButton
                variant="gradient"
                color="info"
                onClick={handleAddNewProduit}
                disabled={
                  !newProduit.referenceProduit ||
                  !newProduit.nomProduit ||
                  !newProduit.prixUnitaireHT ||
                  !newProduit.tvaApplicable
                }
              >
                Créer Produit
              </MDButton>
            ) : (
              <MDButton
                variant="gradient"
                color="info"
                onClick={handleAddItem}
                disabled={!selectedProduit || quantity <= 0}
              >
                Ajouter
              </MDButton>
            )}
          </MDBox>
        </MDBox>
      </Modal>

      <Modal open={showViewModal} onClose={() => setShowViewModal(false)}>
        <MDBox sx={modalStyle}>
          <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <MDTypography variant="h5" id="viewModalLabel">
              Détails de la Facture
            </MDTypography>
            <IconButton onClick={() => setShowViewModal(false)} aria-label="Fermer">
              <Icon>close</Icon>
            </IconButton>
          </MDBox>
          <Grid container spacing={2}>
            {[
              { label: "Numéro Facture", value: currentFacture.numeroFacture },
              {
                label: "Client",
                value:
                  (typeof currentFacture.client === "object"
                    ? currentFacture.client?.nomRaisonSociale
                    : clients.find((c) => c._id === currentFacture.client)?.nomRaisonSociale) ||
                  "N/A",
              },
              {
                label: "Date Facturation",
                value: currentFacture.dateFacturation
                  ? new Date(currentFacture.dateFacturation).toLocaleDateString()
                  : "N/A",
              },
              {
                label: "Date Échéance",
                value: currentFacture.dateEcheance
                  ? new Date(currentFacture.dateEcheance).toLocaleDateString()
                  : "N/A",
              },
              {
                label: "Date Règlement",
                value: currentFacture.dateReglement
                  ? new Date(currentFacture.dateReglement).toLocaleDateString()
                  : "N/A",
              },
              { label: "Mode de Paiement", value: currentFacture.modePaiement || "N/A" },
              { label: "Statut", value: currentFacture.statut || "N/A" },
              { label: "Type Facture", value: currentFacture.typeFacture || "N/A" },
              ...(Number(currentFacture.remise) > 0
                ? [
                    {
                      label: "Montant HT brut",
                      value: `${factureItems
                        .reduce((total, item) => {
                          const produit = produits.find((p) => p._id === item.produit);
                          return total + (produit?.prixUnitaireHT || 0) * item.quantite;
                        }, 0)
                        .toFixed(2)} DT`,
                    },
                    {
                      label: "Remise",
                      value: `${(Number(currentFacture.remise) || 0).toFixed(2)}%`,
                    },
                    {
                      label: "Montant HT net",
                      value: `${(currentFacture.montantHT || 0).toFixed(2)} DT`,
                    },
                  ]
                : [
                    {
                      label: "Montant HT",
                      value: `${(currentFacture.montantHT || 0).toFixed(2)} DT`,
                    },
                  ]),
              { label: "TVA", value: `${(currentFacture.tva || 0).toFixed(2)} DT` },
              { label: "Montant TTC", value: `${(currentFacture.montantTTC || 0).toFixed(2)} DT` },
              { label: "Recherche", value: currentFacture.recherche || "N/A" },
            ].map(({ label, value }) => (
              <Grid item xs={6} key={label}>
                <MDTypography variant="body2" fontWeight="bold" mb={1}>
                  {label}
                </MDTypography>
                <TextField
                  fullWidth
                  value={value}
                  variant="outlined"
                  InputProps={{ readOnly: true }}
                  aria-readonly="true"
                />
              </Grid>
            ))}
          </Grid>
          {factureItems.length > 0 && (
            <MDBox mt={3}>
              <MDTypography variant="h6" fontWeight="medium" mb={2}>
                Articles
              </MDTypography>
              <DataTable
                table={{ columns: itemTableColumns, rows: itemTableRows }}
                isSorted={false}
                entriesPerPage={false}
                showTotalEntries={true}
                noEndBorder
              />
            </MDBox>
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

export default FactureComponent;
