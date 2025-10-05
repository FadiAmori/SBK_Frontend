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
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Autocomplete from "@mui/material/Autocomplete";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";

const BonDeSortieComponent = () => {
  const [bonsDeSortie, setBonsDeSortie] = useState([]);
  const [produits, setProduits] = useState([]);
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [produitSearchQuery, setProduitSearchQuery] = useState("");
  const [quantite, setQuantite] = useState(1);
  const [bonItems, setBonItems] = useState([]);
  const [currentBon, setCurrentBon] = useState({
    _id: "",
    numeroBonSortie: "",
    dateSortie: new Date().toISOString().split("T")[0],
    motifSortie: "",
    destination: "",
    matriculeVehicule: "",
    nomChauffeur: "",
    responsableSortie: "",
    recherche: "",
  });
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showBonModal, setShowBonModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMotif, setFilterMotif] = useState("");

  useEffect(() => {
    Promise.all([fetchBonsDeSortie(), fetchProduits()]).then(() => {
      console.log("Initial data - Produits:", produits);
    });
  }, []);

  const fetchBonsDeSortie = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://sbk-1.onrender.com/api/bons-de-sortie");
      const data = Array.isArray(res.data) ? res.data : [res.data];
      setBonsDeSortie(data);
    } catch (err) {
      setError(err.response?.data?.error || "Échec de la récupération des bons de sortie.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProduits = async () => {
    try {
      const res = await axios.get("https://sbk-1.onrender.com/api/produits");
      const data = Array.isArray(res.data) ? res.data : [res.data];
      console.log("Fetched produits:", data);
      const validProduits = data.filter(
        (produit) =>
          produit &&
          typeof produit === "object" &&
          produit._id &&
          produit.nomProduit &&
          produit.referenceProduit &&
          typeof produit.stockActuel === "number"
      );
      if (validProduits.length !== data.length) {
        console.warn(`Filtered out ${data.length - validProduits.length} invalid produits.`);
      }
      setProduits(validProduits);
    } catch (err) {
      console.error("Error fetching produits:", err);
      setError(err.response?.data?.error || "Échec de la récupération des produits.");
    }
  };

  const handleAddItem = () => {
    if (selectedProduit && quantite > 0) {
      const produit = produits.find((p) => p._id === selectedProduit._id);
      if (!produit) {
        setError("Produit sélectionné non trouvé.");
        return;
      }
      if (produit.stockActuel < quantite) {
        setError(
          `Stock insuffisant pour ${produit.nomProduit}: ${produit.stockActuel} disponible, ${quantite} requis`
        );
        return;
      }
      setBonItems([
        ...bonItems,
        { produit: selectedProduit._id, nomProduit: produit.nomProduit, quantite },
      ]);
      setSelectedProduit(null);
      setProduitSearchQuery("");
      setQuantite(1);
      setShowAddItemModal(false);
      setError(""); // Clear any previous errors
    } else {
      setError("Veuillez sélectionner un produit et une quantité valide.");
    }
  };

  const handleDeleteItem = (index) => {
    setBonItems(bonItems.filter((_, idx) => idx !== index));
    setError(""); // Clear error when modifying items
  };

  const calculateStock = () => {
    const stockChanges = bonItems.reduce(
      (acc, item) => {
        acc.stockAvant += item.quantite;
        acc.stockApres += 0;
        return acc;
      },
      { stockAvant: 0, stockApres: 0 }
    );
    return stockChanges;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentBon((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(""); // Clear error on input change
  };

  const handleCreateBon = () => {
    setIsEditing(false);
    setCurrentBon({
      _id: "",
      numeroBonSortie: "",
      dateSortie: new Date().toISOString().split("T")[0],
      motifSortie: "",
      destination: "",
      matriculeVehicule: "",
      nomChauffeur: "",
      responsableSortie: "",
      recherche: "",
    });
    setBonItems([]);
    setError("");
    setShowBonModal(true);
  };

  const handleEditBon = async (bon) => {
    setIsEditing(true);
    try {
      const res = await axios.get(`https://sbk-1.onrender.com/api/bons-de-sortie/${bon._id}`);
      console.log("Edit bon response:", res.data);
      setCurrentBon({
        ...res.data,
        dateSortie: res.data.dateSortie
          ? new Date(res.data.dateSortie).toISOString().split("T")[0]
          : "",
        recherche: res.data.recherche?.join(", ") || "",
      });
      setBonItems(
        res.data.produits?.map((item) => ({
          produit: item.produit?._id || item.produit,
          nomProduit:
            item.produit?.nomProduit ||
            produits.find((p) => p._id === (item.produit?._id || item.produit))?.nomProduit ||
            "Inconnu",
          quantite: item.quantite,
        })) || []
      );
      setError("");
      setShowBonModal(true);
    } catch (err) {
      setError(err.response?.data?.error || "Échec de la récupération des détails.");
    }
  };

  const handleViewBon = async (bon) => {
    try {
      const res = await axios.get(`https://sbk-1.onrender.com/api/bons-de-sortie/${bon._id}`);
      console.log("View bon response:", res.data);
      setCurrentBon({
        ...res.data,
        dateSortie: res.data.dateSortie
          ? new Date(res.data.dateSortie).toISOString().split("T")[0]
          : "",
        recherche: res.data.recherche?.join(", ") || "",
      });
      setBonItems(
        res.data.produits?.map((item) => ({
          produit: item.produit?._id || item.produit,
          nomProduit:
            item.produit?.nomProduit ||
            produits.find((p) => p._id === (item.produit?._id || item.produit))?.nomProduit ||
            "Inconnu",
          quantite: item.quantite,
        })) || []
      );
      setShowViewModal(true);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Échec de la récupération des détails.");
    }
  };

  const handleDeleteBon = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce bon de sortie ?")) {
      try {
        await axios.delete(`https://sbk-1.onrender.com/api/bons-de-sortie/${id}`);
        setBonsDeSortie((prev) => prev.filter((bon) => bon._id !== id));
        setError("");
      } catch (err) {
        setError(err.response?.data?.error || "Échec de la suppression du bon de sortie.");
        fetchBonsDeSortie();
      }
    }
  };

  const handleSubmitBon = async (e) => {
    e.preventDefault();
    const { _id, numeroBonSortie, recherche, ...payload } = currentBon;

    payload.recherche = recherche
      ? recherche
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    payload.produits = bonItems.map((item) => ({ produit: item.produit, quantite: item.quantite }));
    const { stockAvant, stockApres } = calculateStock();
    payload.stockAvantSortie = stockAvant;
    payload.stockApresSortie = stockApres;

    console.log("Submit bon payload:", payload);

    if (payload.produits.length === 0) {
      setError("Veuillez ajouter au moins un produit.");
      return;
    }

    // Client-side stock validation
    for (const item of payload.produits) {
      const produit = produits.find((p) => p._id === item.produit);
      if (!produit) {
        setError(`Produit invalide: ${item.produit}`);
        return;
      }
      if (produit.stockActuel < item.quantite) {
        setError(
          `Stock insuffisant pour ${produit.nomProduit}: ${produit.stockActuel} disponible, ${item.quantite} requis`
        );
        return;
      }
    }

    const maxRetries = 3;
    let attempts = 0;

    while (attempts < maxRetries) {
      try {
        let response;
        if (isEditing) {
          response = await axios.put(`https://sbk-1.onrender.com/api/bons-de-sortie/${_id}`, payload);
        } else {
          response = await axios.post("https://sbk-1.onrender.com/api/bons-de-sortie", payload);
        }
        console.log("Create/Update response:", response.data);
        const populatedBon = await axios.get(
          `https://sbk-1.onrender.com/api/bons-de-sortie/${response.data._id}`
        );
        console.log("Populated bon:", populatedBon.data);
        generatePDF(populatedBon.data);
        fetchBonsDeSortie();
        setShowBonModal(false);
        setError("");
        return; // Success, exit the loop
      } catch (err) {
        const errorMessage =
          err.response?.data?.error || "Échec de l'enregistrement: " + err.message;
        console.error("Error submitting bon (attempt " + (attempts + 1) + "):", err);
        if (
          errorMessage.includes("Failed to generate unique numeroBonSortie") &&
          attempts < maxRetries - 1
        ) {
          attempts++;
          setError(`Tentative ${attempts} : Numéro de bon en conflit, nouvelle tentative...`);
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retrying
          continue;
        }
        setError(errorMessage);
        fetchBonsDeSortie(); // Refresh list in case of partial failure
        return;
      }
    }
  };

  const generatePDF = (bon) => {
    try {
      console.log("Generating PDF with bon:", bon);
      if (!bon) {
        throw new Error("Bon de sortie object is null or undefined");
      }
      if (!bon.produits || !Array.isArray(bon.produits)) {
        throw new Error("Produits list is missing or not an array");
      }
      const doc = new jsPDF();
      const margin = 10;
      const pageWidth = doc.internal.pageSize.width;
      const logoUrl = "/images/Facture3.jpg";
      const logoWidth = pageWidth - 2 * margin;
      const logoHeight = 40;
      const logoX = margin;
      const logoY = 10;
      doc.setFont("helvetica", "normal");
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
        doc.text("Bon de Sortie", pageWidth / 2, logoY + logoHeight + 10, { align: "center" });
        doc.setFontSize(12);
        // Left column
        doc.text(`Destination: ${bon.destination || "N/A"}`, margin, logoY + logoHeight + 20);
        doc.text(`Numéro Bon: ${bon.numeroBonSortie || "N/A"}`, margin, logoY + logoHeight + 30);
        doc.text(
          `Matricule Véhicule: ${bon.matriculeVehicule || "N/A"}`,
          margin,
          logoY + logoHeight + 40
        );
        // Right column
        doc.text(
          `Date Sortie: ${
            bon.dateSortie ? new Date(bon.dateSortie).toLocaleDateString("fr-FR") : "N/A"
          }`,
          pageWidth - margin,
          logoY + logoHeight + 20,
          { align: "right" }
        );
        doc.text(
          `Motif: ${bon.motifSortie || "N/A"}`,
          pageWidth - margin,
          logoY + logoHeight + 30,
          { align: "right" }
        );
        doc.text(
          `Nom Chauffeur: ${bon.nomChauffeur || "N/A"}`,
          pageWidth - margin,
          logoY + logoHeight + 40,
          { align: "right" }
        );
        doc.text(
          `Responsable Sortie: ${bon.responsableSortie || "N/A"}`,
          pageWidth - margin,
          logoY + logoHeight + 50,
          { align: "right" }
        );
      };
      addHeader();
      // Aggregate quantities, names, and prices from all selected produits
      const productTotals = {};
      let totalHT = 0;
      let totalTTC = 0;
      bon.produits.forEach((item) => {
        const produit = item.produit?._id || item.produit;
        if (!productTotals[produit]) {
          productTotals[produit] = {
            quantite: 0,
            nomProduit: item.produit?.nomProduit || "Inconnu",
            prixUnitaireHT: item.produit?.prixUnitaireHT || 0,
            tva: item.produit?.tvaApplicable || 0,
          };
        }
        productTotals[produit].quantite += item.quantite;
        const productTotalHT = item.quantite * (item.produit?.prixUnitaireHT || 0);
        totalHT += productTotalHT;
        totalTTC += productTotalHT * (1 + (item.produit?.tvaApplicable || 0) / 100);
      });
      const tableBody = Object.entries(productTotals).map(([produitId, data]) => {
        const totalPrice = data.quantite * data.prixUnitaireHT;
        return [
          data.quantite,
          data.nomProduit,
          `${data.prixUnitaireHT.toFixed(2)} DT`,
          `${totalPrice.toFixed(2)} DT`,
          "", // Blank column for "Reste de retour"
        ];
      });
      autoTable(doc, {
        startY: logoY + logoHeight + 60,
        head: [
          ["Quantité Totale", "Désignation", "Prix Unitaire", "Prix Total", "Reste de retour"],
        ],
        body: tableBody,
        theme: "grid",
        margin: { top: logoY + logoHeight + 60, left: margin, right: margin },
        styles: { fontSize: 10, cellPadding: 2, font: "helvetica" },
        headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: "auto" },
          2: { cellWidth: 40 },
          3: { cellWidth: 40 },
          4: { cellWidth: 40 },
        },
        didDrawPage: addHeader,
      });
      const itemsFinalY = doc.lastAutoTable.finalY || logoY + logoHeight + 70;
      const detailsStartY = itemsFinalY + 10;
      autoTable(doc, {
        startY: detailsStartY,
        body: [
          ["Stock Avant Sortie", `${bon.stockAvantSortie || 0}`],
          ["Stock Après Sortie", `${bon.stockApresSortie || 0}`],
          ["Montant TTC", `${totalTTC.toFixed(2)} DT`],
        ],
        theme: "grid",
        margin: { left: margin + 50, right: margin },
        styles: { fontSize: 10, cellPadding: 2, font: "helvetica" },
      });
      const detailsFinalY = doc.lastAutoTable.finalY || detailsStartY;
      const totalsStartY = detailsFinalY + 10;
      doc.setFontSize(12);
      doc.text("Arrêté le présent bon de sortie à la somme de :", margin, totalsStartY + 10);
      doc.text("(en lettres)", margin, totalsStartY + 20);
      doc.text("Signature & Cachet", pageWidth - margin, totalsStartY + 20, { align: "right" });
      // Ensure the text is always included by adding it as a mandatory section
      if (doc.internal.getCurrentPageInfo().pageNumber > 1) {
        doc.addPage();
        doc.text("Arrêté le présent bon de sortie à la somme de :", margin, 10);
        doc.text("(en lettres)", margin, 20);
        doc.text("Signature & Cachet", pageWidth - margin, 20, { align: "right" });
      }
      doc.save(`bon_de_sortie_${bon.numeroBonSortie || bon._id}.pdf`);
    } catch (err) {
      console.error("Erreur lors de la génération du PDF:", err.message);
      setError(`Échec de la génération du PDF: ${err.message}`);
    }
  };
  const filteredBons = bonsDeSortie.filter((bon) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = query
      ? bon.numeroBonSortie.toLowerCase().includes(query) ||
        bon.destination?.toLowerCase().includes(query) ||
        bon.recherche?.some((term) => term.toLowerCase().includes(query))
      : true;
    const matchesMotif = filterMotif ? bon.motifSortie === filterMotif : true;
    return matchesSearch && matchesMotif;
  });

  const filteredProduits = produits.filter((produit) => {
    const query = produitSearchQuery.toLowerCase();
    if (!produit || !produit.nomProduit || !produit.referenceProduit) {
      console.warn("Invalid produit detected:", produit);
      return false;
    }
    return (
      !query ||
      produit.nomProduit.toLowerCase().includes(query) ||
      produit.referenceProduit.toLowerCase().includes(query)
    );
  });

  const bonTableColumns = [
    { Header: "Numéro Bon", accessor: "numeroBonSortie", align: "center" },
    { Header: "Destination", accessor: "destination", align: "center" },
    { Header: "Date Sortie", accessor: "dateSortie", align: "center" },
    { Header: "Motif", accessor: "motifSortie", align: "center" },
    { Header: "Actions", accessor: "actions", align: "center" },
  ];

  const bonTableRows = filteredBons.map((bon) => ({
    numeroBonSortie: bon.numeroBonSortie || "N/A",
    destination: bon.destination || "N/A",
    dateSortie: bon.dateSortie ? new Date(bon.dateSortie).toLocaleDateString() : "N/A",
    motifSortie: bon.motifSortie || "N/A",
    actions: (
      <MDBox display="flex" justifyContent="center" alignItems="center" gap={1}>
        <IconButton
          color="info"
          onClick={() => handleViewBon(bon)}
          disabled={!bon._id}
          aria-label="Voir les détails"
        >
          <Icon>visibility</Icon>
        </IconButton>
        <IconButton
          color="warning"
          onClick={() => handleEditBon(bon)}
          disabled={!bon._id}
          aria-label="Modifier"
        >
          <Icon>edit</Icon>
        </IconButton>
        <IconButton
          color="error"
          onClick={() => handleDeleteBon(bon._id)}
          disabled={!bon._id}
          aria-label="Supprimer"
        >
          <Icon>delete</Icon>
        </IconButton>
      </MDBox>
    ),
  }));

  const itemTableColumns = [
    { Header: "Nom Produit", accessor: "nomProduit", align: "center" },
    { Header: "Quantité", accessor: "quantite", align: "center" },
    { Header: "Actions", accessor: "actions", align: "center" },
  ];

  const itemTableRows = bonItems.map((item, index) => ({
    nomProduit: item.nomProduit || "Inconnu",
    quantite: item.quantite || 0,
    actions: (
      <MDBox display="flex" justifyContent="center" alignItems="center" gap={1}>
        <IconButton color="error" onClick={() => handleDeleteItem(index)} aria-label="Supprimer">
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
    maxHeight: "80vh",
    overflowY: "auto",
  };

  const addItemModalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "80%",
    maxWidth: "500px",
    bgcolor: "background.paper",
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterMotif("");
    setError("");
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
                  Gestion des Bons de Sortie
                </MDTypography>
                <MDBox>
                  <MDButton
                    variant="gradient"
                    color="info"
                    onClick={handleCreateBon}
                    aria-label="Créer un bon de sortie"
                  >
                    <Icon>add</Icon> Nouveau Bon de Sortie
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
                      placeholder="Rechercher (numéro, destination, etc.)"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MDTypography variant="body2" fontWeight="bold" mb={1}>
                      Motif
                    </MDTypography>
                    <Select
                      fullWidth
                      value={filterMotif}
                      onChange={(e) => setFilterMotif(e.target.value)}
                      displayEmpty
                      variant="outlined"
                    >
                      <MenuItem value="">Tous</MenuItem>
                      {["Vente", "Don", "Transfert", "Usage interne"].map((motif) => (
                        <MenuItem key={motif} value={motif}>
                          {motif}
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
                  table={{ columns: bonTableColumns, rows: bonTableRows }}
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

      <Modal open={showBonModal} onClose={() => setShowBonModal(false)}>
        <MDBox sx={modalStyle}>
          <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <MDTypography variant="h5" id="bonModalLabel">
              {isEditing ? "Modifier le Bon de Sortie" : "Créer un Bon de Sortie"}
            </MDTypography>
            <IconButton onClick={() => setShowBonModal(false)} aria-label="Fermer">
              <Icon>close</Icon>
            </IconButton>
          </MDBox>
          <form onSubmit={handleSubmitBon}>
            <Grid container spacing={2}>
              {[
                { label: "Date Sortie", name: "dateSortie", type: "date", required: true },
                { label: "Destination", name: "destination", type: "text" },
                { label: "Matricule Véhicule", name: "matriculeVehicule", type: "text" },
                { label: "Nom Chauffeur", name: "nomChauffeur", type: "text" },
                { label: "Responsable Sortie", name: "responsableSortie", type: "text" },
                { label: "Recherche (séparé par virgules)", name: "recherche", type: "text" },
              ].map(({ label, name, type, required }) => (
                <Grid item xs={6} key={name}>
                  <MDTypography variant="body2" fontWeight="bold" mb={1}>
                    {label} {required && <span style={{ color: "red" }}>*</span>}
                  </MDTypography>
                  <TextField
                    fullWidth
                    type={type}
                    name={name}
                    value={currentBon[name] ?? ""}
                    onChange={handleInputChange}
                    variant="outlined"
                    required={required}
                    InputLabelProps={type === "date" ? { shrink: true } : {}}
                  />
                </Grid>
              ))}
              <Grid item xs={6}>
                <MDTypography variant="body2" fontWeight="bold" mb={1}>
                  Motif Sortie <span style={{ color: "red" }}>*</span>
                </MDTypography>
                <Select
                  fullWidth
                  name="motifSortie"
                  value={currentBon.motifSortie || ""}
                  onChange={handleInputChange}
                  variant="outlined"
                  required
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    Sélectionner un motif
                  </MenuItem>
                  {["Vente", "Don", "Transfert", "Usage interne"].map((motif) => (
                    <MenuItem key={motif} value={motif}>
                      {motif}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
            </Grid>
            <MDBox mt={3}>
              <MDTypography variant="h6" fontWeight="medium" mb={2}>
                Produits
              </MDTypography>
              {bonItems.length > 0 ? (
                <DataTable
                  table={{ columns: itemTableColumns, rows: itemTableRows }}
                  isSorted={false}
                  entriesPerPage={false}
                  showTotalEntries={true}
                  noEndBorder
                />
              ) : (
                <MDTypography variant="body2">Aucun produit ajouté.</MDTypography>
              )}
              <MDButton
                variant="outlined"
                color="info"
                onClick={() => setShowAddItemModal(true)}
                sx={{ mt: 2 }}
              >
                Ajouter un produit
              </MDButton>
            </MDBox>
            {error && (
              <MDBox mt={2}>
                <MDTypography variant="body2" color="error">
                  {error}
                </MDTypography>
              </MDBox>
            )}
            <MDBox mt={3} display="flex" justifyContent="flex-end" gap={2}>
              <MDButton variant="outlined" color="secondary" onClick={() => setShowBonModal(false)}>
                Annuler
              </MDButton>
              <MDButton
                variant="gradient"
                color="success"
                type="submit"
                disabled={bonItems.length === 0 || !currentBon.motifSortie}
              >
                {isEditing ? "Mettre à jour" : "Créer et Télécharger PDF"}
              </MDButton>
            </MDBox>
          </form>
        </MDBox>
      </Modal>

      <Modal open={showAddItemModal} onClose={() => setShowAddItemModal(false)}>
        <MDBox sx={addItemModalStyle}>
          <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <MDTypography variant="h5" id="addItemModalLabel">
              Ajouter un produit
            </MDTypography>
            <IconButton onClick={() => setShowAddItemModal(false)} aria-label="Fermer">
              <Icon>close</Icon>
            </IconButton>
          </MDBox>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <MDTypography variant="body2" fontWeight="bold" mb={1}>
                Rechercher un produit <span style={{ color: "red" }}>*</span>
              </MDTypography>
              <Autocomplete
                options={filteredProduits}
                getOptionLabel={(produit) =>
                  produit && produit.nomProduit && produit.referenceProduit
                    ? `${produit.nomProduit} (Ref: ${produit.referenceProduit}, Stock: ${produit.stockActuel})`
                    : ""
                }
                value={selectedProduit}
                onChange={(event, newValue) => setSelectedProduit(newValue)}
                inputValue={produitSearchQuery}
                onInputChange={(event, newInputValue) => setProduitSearchQuery(newInputValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    placeholder="Rechercher par nom ou référence"
                  />
                )}
                noOptionsText="Aucun produit trouvé"
                filterOptions={(options, { inputValue }) => {
                  const query = inputValue.toLowerCase();
                  return options.filter((produit) => {
                    if (!produit || !produit.nomProduit || !produit.referenceProduit) {
                      console.warn("Invalid produit in filterOptions:", produit);
                      return false;
                    }
                    return (
                      produit.nomProduit.toLowerCase().includes(query) ||
                      produit.referenceProduit.toLowerCase().includes(query)
                    );
                  });
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <MDTypography variant="body2" fontWeight="bold" mb={1}>
                Quantité <span style={{ color: "red" }}>*</span>
              </MDTypography>
              <TextField
                fullWidth
                type="number"
                value={quantite}
                onChange={(e) => setQuantite(Number(e.target.value))}
                variant="outlined"
                inputProps={{ min: 1 }}
              />
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
            <MDButton
              variant="outlined"
              color="secondary"
              onClick={() => {
                setShowAddItemModal(false);
                setProduitSearchQuery("");
                setSelectedProduit(null);
                setQuantite(1);
                setError("");
              }}
            >
              Annuler
            </MDButton>
            <MDButton
              variant="gradient"
              color="info"
              onClick={handleAddItem}
              disabled={!selectedProduit || quantite <= 0}
            >
              Ajouter
            </MDButton>
          </MDBox>
        </MDBox>
      </Modal>

      <Modal open={showViewModal} onClose={() => setShowViewModal(false)}>
        <MDBox sx={modalStyle}>
          <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <MDTypography variant="h5" id="viewModalLabel">
              Détails du Bon de Sortie
            </MDTypography>
            <IconButton onClick={() => setShowViewModal(false)} aria-label="Fermer">
              <Icon>close</Icon>
            </IconButton>
          </MDBox>
          <Grid container spacing={2}>
            {[
              { label: "Numéro Bon Sortie", value: currentBon.numeroBonSortie },
              { label: "Destination", value: currentBon.destination || "N/A" },
              {
                label: "Date Sortie",
                value: currentBon.dateSortie
                  ? new Date(currentBon.dateSortie).toLocaleDateString()
                  : "N/A",
              },
              { label: "Motif Sortie", value: currentBon.motifSortie || "N/A" },
              { label: "Matricule Véhicule", value: currentBon.matriculeVehicule || "N/A" },
              { label: "Nom Chauffeur", value: currentBon.nomChauffeur || "N/A" },
              { label: "Responsable Sortie", value: currentBon.responsableSortie || "N/A" },
              { label: "Stock Avant Sortie", value: `${currentBon.stockAvantSortie || 0}` },
              { label: "Stock Après Sortie", value: `${currentBon.stockApresSortie || 0}` },
              { label: "Recherche", value: currentBon.recherche || "N/A" },
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
          {bonItems.length > 0 && (
            <MDBox mt={3}>
              <MDTypography variant="h6" fontWeight="medium" mb={2}>
                Produits
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

export default BonDeSortieComponent;
