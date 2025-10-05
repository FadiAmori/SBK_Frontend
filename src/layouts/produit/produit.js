/* eslint-disable react/no-unescaped-entities */
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
import CircularProgress from "@mui/material/CircularProgress";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";

// Data
const tableColumns = [
  { Header: "Référence", accessor: "referenceProduit", align: "center" },
  { Header: "Nom", accessor: "nomProduit", align: "center" },
  { Header: "Catégorie", accessor: "categorie", align: "center" },
  { Header: "Prix d'Achat (DT)", accessor: "prixAchat", align: "center" },
  { Header: "Prix Unitaire HT (DT)", accessor: "prixUnitaireHT", align: "center" },
  { Header: "Marge (%)", accessor: "margeDegagnante", align: "center" },
  { Header: "TVA (%)", accessor: "tvaApplicable", align: "center" },
  { Header: "Stock Actuel", accessor: "stockActuel", align: "center" },
  { Header: "Fournisseur", accessor: "fournisseurPrincipal", align: "center" },
  { Header: "Actions", accessor: "actions", align: "center" },
];

const ProduitComponent = () => {
  const [produits, setProduits] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCalcModal, setShowCalcModal] = useState(false); // New state for calc modal
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [retryButtonVisible, setRetryButtonVisible] = useState(false);
  const [currentProduit, setCurrentProduit] = useState({
    _id: "",
    referenceProduit: "",
    nomProduit: "",
    categorie: "",
    description: "",
    prixAchat: "",
    prixUnitaireHT: "",
    margeDegagnante: "",
    tvaApplicable: "",
    stockActuel: "",
    stockMinimal: "",
    seuilReapprovisionnement: "",
    fournisseurPrincipal: "",
    quantite: "",
    stockAvantMouvement: "",
    stockApresMouvement: "",
    recherche: "",
    rechercheCorrespondance: "",
  });
  const [calcState, setCalcState] = useState({
    produit: null,
    quantity: 1,
    discount: 0,
    unitPriceAfterDiscount: 0,
    totalPrice: 0,
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategorie, setFilterCategorie] = useState("");
  const [filterFournisseur, setFilterFournisseur] = useState("");
  const [minStock, setMinStock] = useState("");
  const [maxStock, setMaxStock] = useState("");
  const [minPrix, setMinPrix] = useState("");
  const [maxPrix, setMaxPrix] = useState("");

  useEffect(() => {
    fetchProduits();
    fetchFournisseurs();
  }, []);

  const fetchProduits = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://sbk-1.onrender.com/api/produits");
      const data = Array.isArray(res.data) ? res.data : [res.data];
      setProduits(data);
    } catch (err) {
      setError(err.response?.data?.error || "Échec de la récupération des produits.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFournisseurs = async () => {
    try {
      const res = await axios.get("https://sbk-1.onrender.com/api/fournisseurs");
      setFournisseurs(Array.isArray(res.data) ? res.data : [res.data]);
    } catch (err) {
      setError(err.response?.data?.error || "Échec de la récupération des fournisseurs.");
    }
  };

  const uniqueCategories = [
    ...new Set(produits.map((produit) => produit.categorie).filter(Boolean)),
  ].sort();
  const uniqueFournisseurs = fournisseurs
    .map((f) => ({
      _id: f._id,
      nom: f.nomRaisonSociale,
    }))
    .sort((a, b) => a.nom.localeCompare(b.nom));

  const handleAdd = () => {
    setIsEditing(false);
    setCurrentProduit({
      _id: "",
      referenceProduit: "",
      nomProduit: "",
      categorie: "",
      description: "",
      prixAchat: "",
      prixUnitaireHT: "",
      margeDegagnante: "",
      tvaApplicable: "",
      stockActuel: "",
      stockMinimal: "",
      seuilReapprovisionnement: "",
      fournisseurPrincipal: "",
      quantite: "",
      stockAvantMouvement: "",
      stockApresMouvement: "",
      recherche: "",
      rechercheCorrespondance: "",
    });
    setError("");
    setRetryButtonVisible(false);
    setShowModal(true);
  };

  const handleEdit = (produit) => {
    setIsEditing(true);
    setCurrentProduit({
      _id: produit._id || "",
      referenceProduit: produit.referenceProduit || "",
      nomProduit: produit.nomProduit || "",
      categorie: produit.categorie || "",
      description: produit.description || "",
      prixAchat: produit.prixAchat !== undefined ? produit.prixAchat.toString() : "",
      prixUnitaireHT: produit.prixUnitaireHT !== undefined ? produit.prixUnitaireHT.toString() : "",
      margeDegagnante:
        produit.margeDegagnante !== undefined ? produit.margeDegagnante.toString() : "",
      tvaApplicable: produit.tvaApplicable !== undefined ? produit.tvaApplicable.toString() : "",
      stockActuel: produit.stockActuel !== undefined ? produit.stockActuel.toString() : "",
      stockMinimal: produit.stockMinimal !== undefined ? produit.stockMinimal.toString() : "",
      seuilReapprovisionnement:
        produit.seuilReapprovisionnement !== undefined
          ? produit.seuilReapprovisionnement.toString()
          : "",
      fournisseurPrincipal: produit.fournisseurPrincipal?._id || produit.fournisseurPrincipal || "",
      quantite: produit.quantite !== undefined ? produit.quantite.toString() : "",
      stockAvantMouvement:
        produit.stockAvantMouvement !== undefined ? produit.stockAvantMouvement.toString() : "",
      stockApresMouvement:
        produit.stockApresMouvement !== undefined ? produit.stockApresMouvement.toString() : "",
      recherche: produit.recherche?.join(", ") || "",
      rechercheCorrespondance: produit.rechercheCorrespondance?.join(", ") || "",
    });
    setError("");
    setRetryButtonVisible(false);
    setShowModal(true);
  };

  const handleView = async (produit) => {
    try {
      const res = await axios.get(`https://sbk-1.onrender.com/api/produits/${produit._id}`);
      setCurrentProduit({
        _id: res.data._id || "",
        referenceProduit: res.data.referenceProduit || "",
        nomProduit: res.data.nomProduit || "",
        categorie: res.data.categorie || "",
        description: res.data.description || "",
        prixAchat: res.data.prixAchat !== undefined ? res.data.prixAchat.toString() : "",
        prixUnitaireHT:
          res.data.prixUnitaireHT !== undefined ? res.data.prixUnitaireHT.toString() : "",
        margeDegagnante:
          res.data.margeDegagnante !== undefined ? res.data.margeDegagnante.toString() : "",
        tvaApplicable:
          res.data.tvaApplicable !== undefined ? res.data.tvaApplicable.toString() : "",
        stockActuel: res.data.stockActuel !== undefined ? res.data.stockActuel.toString() : "",
        stockMinimal: res.data.stockMinimal !== undefined ? res.data.stockMinimal.toString() : "",
        seuilReapprovisionnement:
          res.data.seuilReapprovisionnement !== undefined
            ? res.data.seuilReapprovisionnement.toString()
            : "",
        fournisseurPrincipal:
          res.data.fournisseurPrincipal?._id || res.data.fournisseurPrincipal || "",
        quantite: res.data.quantite !== undefined ? res.data.quantite.toString() : "",
        stockAvantMouvement:
          res.data.stockAvantMouvement !== undefined ? res.data.stockAvantMouvement.toString() : "",
        stockApresMouvement:
          res.data.stockApresMouvement !== undefined ? res.data.stockApresMouvement.toString() : "",
        recherche: res.data.recherche?.join(", ") || "",
        rechercheCorrespondance: res.data.rechercheCorrespondance?.join(", ") || "",
      });
      setShowViewModal(true);
    } catch (err) {
      setError(err.response?.data?.error || "Échec de la récupération des détails.");
    }
  };

  const handleCalculate = (produit) => {
    setCalcState({
      produit,
      quantity: 1,
      discount: 0,
      unitPriceAfterDiscount: Number(produit.prixUnitaireHT) || 0,
      totalPrice:
        (Number(produit.prixUnitaireHT) || 0) * (1 + (Number(produit.tvaApplicable) || 0) / 100),
    });
    setError("");
    setShowCalcModal(true);
  };

  const handleCalcInputChange = (e) => {
    const { name, value } = e.target;
    setCalcState((prev) => {
      let newState = { ...prev, [name]: value === "" ? 0 : Number(value) };
      if (name === "quantity" || name === "discount") {
        const quantity = name === "quantity" ? Number(value) || 0 : prev.quantity;
        const discount = name === "discount" ? Number(value) || 0 : prev.discount;
        const basePrice = Number(prev.produit.prixUnitaireHT) || 0;
        const tva = Number(prev.produit.tvaApplicable) || 0;
        newState.unitPriceAfterDiscount = basePrice * (1 - discount / 100);
        newState.totalPrice = quantity * newState.unitPriceAfterDiscount * (1 + tva / 100);
      }
      return newState;
    });
  };

  const handleCalcOperation = (operation) => {
    setCalcState((prev) => {
      let newQuantity = prev.quantity;
      if (operation === "add") {
        newQuantity += 1;
      } else if (operation === "subtract" && prev.quantity > 1) {
        newQuantity -= 1;
      } else if (operation === "reset") {
        return {
          ...prev,
          discount: 0,
          unitPriceAfterDiscount: Number(prev.produit.prixUnitaireHT) || 0,
          totalPrice:
            newQuantity *
            (Number(prev.produit.prixUnitaireHT) || 0) *
            (1 + (Number(prev.produit.tvaApplicable) || 0) / 100),
        };
      }
      const basePrice = Number(prev.produit.prixUnitaireHT) || 0;
      const tva = Number(prev.produit.tvaApplicable) || 0;
      const unitPriceAfterDiscount = basePrice * (1 - prev.discount / 100);
      return {
        ...prev,
        quantity: newQuantity,
        unitPriceAfterDiscount,
        totalPrice: newQuantity * unitPriceAfterDiscount * (1 + tva / 100),
      };
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      try {
        await axios.delete(`https://sbk-1.onrender.com/api/produits/${id}`);
        setProduits((prev) => prev.filter((produit) => produit._id !== id));
        setError("");
      } catch (err) {
        setError(err.response?.data?.error || "Échec de la suppression du produit.");
        fetchProduits();
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (
      [
        "prixAchat",
        "prixUnitaireHT",
        "margeDegagnante",
        "tvaApplicable",
        "stockActuel",
        "stockMinimal",
        "seuilReapprovisionnement",
        "quantite",
        "stockAvantMouvement",
        "stockApresMouvement",
      ].includes(name)
    ) {
      newValue = value === "" ? "" : Math.max(0, Number(value)).toString();
    }

    setCurrentProduit((prev) => {
      let updatedProduit = { ...prev, [name]: newValue };

      if (name === "prixAchat" && Number(newValue) > 0) {
        const margeDegagnante = Number(prev.margeDegagnante) || 0;
        updatedProduit.prixUnitaireHT = (Number(newValue) * (1 + margeDegagnante / 100)).toFixed(2);
      } else if (name === "margeDegagnante" && Number(newValue) >= 0) {
        const prixAchat = Number(prev.prixAchat) || 0;
        if (prixAchat > 0) {
          updatedProduit.prixUnitaireHT = (prixAchat * (1 + Number(newValue) / 100)).toFixed(2);
        }
      } else if (name === "prixUnitaireHT" && Number(newValue) > 0) {
        const prixAchat = Number(prev.prixAchat) || 0;
        if (prixAchat > 0 && Number(newValue) >= prixAchat) {
          updatedProduit.margeDegagnante = (
            ((Number(newValue) - prixAchat) / prixAchat) *
            100
          ).toFixed(2);
        }
      }

      return updatedProduit;
    });
    setError("");
    setRetryButtonVisible(false);
  };

  const handleSubmit = async (e, retryCount = 0, maxRetries = 5) => {
    e.preventDefault();
    const { _id, referenceProduit, recherche, rechercheCorrespondance, ...payload } =
      currentProduit;

    payload.prixAchat = Number(payload.prixAchat);
    payload.prixUnitaireHT = Number(payload.prixUnitaireHT);
    payload.margeDegagnante = Number(payload.margeDegagnante);
    payload.tvaApplicable = Number(payload.tvaApplicable);
    payload.stockActuel = Number(payload.stockActuel) || 0;
    payload.stockMinimal = Number(payload.stockMinimal) || 0;
    payload.seuilReapprovisionnement = Number(payload.seuilReapprovisionnement) || 0;
    payload.quantite = Number(payload.quantite) || 0;
    payload.stockAvantMouvement = Number(payload.stockAvantMouvement) || 0;
    payload.stockApresMouvement = Number(payload.stockApresMouvement) || 0;

    if (!payload.nomProduit) {
      setError("Le nom du produit est requis.");
      setRetryButtonVisible(false);
      return;
    }
    if (!payload.prixAchat || payload.prixAchat <= 0) {
      setError("Le prix d'achat doit être supérieur à 0.");
      setRetryButtonVisible(false);
      return;
    }
    if (!payload.prixUnitaireHT || payload.prixUnitaireHT <= 0) {
      setError("Le prix unitaire HT doit être supérieur à 0.");
      setRetryButtonVisible(false);
      return;
    }
    if (payload.margeDegagnante < 0) {
      setError("La marge dégagnante ne peut pas être négative.");
      setRetryButtonVisible(false);
      return;
    }
    if (payload.tvaApplicable < 0) {
      setError("La TVA applicable ne peut pas être négative.");
      setRetryButtonVisible(false);
      return;
    }
    if (payload.prixUnitaireHT < payload.prixAchat) {
      setError("Le prix unitaire HT doit être supérieur ou égal au prix d'achat.");
      setRetryButtonVisible(false);
      return;
    }

    payload.recherche = recherche
      ? recherche
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    payload.rechercheCorrespondance = rechercheCorrespondance
      ? rechercheCorrespondance
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    setSubmitLoading(true);
    try {
      let response;
      if (isEditing) {
        response = await axios.put(`https://sbk-1.onrender.com/api/produits/${_id}`, payload);
      } else {
        response = await axios.post("https://sbk-1.onrender.com/api/produits", payload);
      }
      fetchProduits();
      setShowModal(false);
      setError("");
      setRetryButtonVisible(false);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Échec de l'enregistrement.";
      if (
        errorMessage.includes("Impossible de générer une référence produit unique") &&
        retryCount < maxRetries
      ) {
        const delay = 500 * Math.pow(2, retryCount);
        setError(
          `Tentative ${retryCount + 1}/${maxRetries} échouée. Nouvelle tentative dans ${
            delay / 1000
          }s...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return handleSubmit(e, retryCount + 1, maxRetries);
      }
      setError(errorMessage);
      setRetryButtonVisible(
        errorMessage.includes("Impossible de générer une référence produit unique")
      );
      fetchProduits();
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleManualRetry = (e) => {
    setError("");
    setRetryButtonVisible(false);
    handleSubmit(e);
  };

  const filteredProduits = produits.filter((produit) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = query
      ? produit.referenceProduit.toLowerCase().includes(query) ||
        produit.nomProduit.toLowerCase().includes(query) ||
        (produit.categorie?.toLowerCase().includes(query) ?? false) ||
        (produit.description?.toLowerCase().includes(query) ?? false) ||
        produit.prixAchat.toString().includes(query) ||
        produit.prixUnitaireHT.toString().includes(query) ||
        produit.margeDegagnante.toString().includes(query) ||
        produit.tvaApplicable.toString().includes(query) ||
        produit.stockActuel.toString().includes(query) ||
        produit.recherche?.some((term) => term.toLowerCase().includes(query)) ||
        produit.rechercheCorrespondance?.some((term) => term.toLowerCase().includes(query)) ||
        (produit.fournisseurPrincipal?.nomRaisonSociale?.toLowerCase().includes(query) ?? false)
      : true;
    const matchesCategorie = filterCategorie ? produit.categorie === filterCategorie : true;
    const matchesFournisseur = filterFournisseur
      ? produit.fournisseurPrincipal?._id === filterFournisseur
      : true;
    const matchesMinStock = minStock ? produit.stockActuel >= Number(minStock) : true;
    const matchesMaxStock = maxStock ? produit.stockActuel <= Number(maxStock) : true;
    const matchesMinPrix = minPrix ? produit.prixUnitaireHT >= Number(minPrix) : true;
    const matchesMaxPrix = maxPrix ? produit.prixUnitaireHT <= Number(maxPrix) : true;

    return (
      matchesSearch &&
      matchesCategorie &&
      matchesFournisseur &&
      matchesMinStock &&
      matchesMaxStock &&
      matchesMinPrix &&
      matchesMaxPrix
    );
  });

  const tableRows = filteredProduits.map((produit) => ({
    referenceProduit: produit.referenceProduit || "N/A",
    nomProduit: produit.nomProduit || "N/A",
    categorie: produit.categorie || "N/A",
    prixAchat: `${(produit.prixAchat || 0).toFixed(2)} DT`,
    prixUnitaireHT: `${(produit.prixUnitaireHT || 0).toFixed(2)} DT`,
    margeDegagnante: `${(produit.margeDegagnante || 0).toFixed(2)} %`,
    tvaApplicable: `${(produit.tvaApplicable || 0).toFixed(2)} %`,
    stockActuel: produit.stockActuel || 0,
    fournisseurPrincipal: produit.fournisseurPrincipal?.nomRaisonSociale || "N/A",
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
        <IconButton
          color="warning"
          onClick={() => handleEdit(produit)}
          disabled={!produit._id}
          aria-label="Modifier"
        >
          <Icon>edit</Icon>
        </IconButton>
        <IconButton
          color="error"
          onClick={() => handleDelete(produit._id)}
          disabled={!produit._id}
          aria-label="Supprimer"
        >
          <Icon>delete</Icon>
        </IconButton>
        <IconButton
          color="success"
          onClick={() => handleCalculate(produit)}
          disabled={!produit._id}
          aria-label="Calculer"
        >
          <Icon>calculate</Icon>
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

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterCategorie("");
    setFilterFournisseur("");
    setMinStock("");
    setMaxStock("");
    setMinPrix("");
    setMaxPrix("");
    setError("");
    setRetryButtonVisible(false);
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
                  Gestion des Produits
                </MDTypography>
                <MDBox>
                  <MDButton
                    variant="gradient"
                    color="info"
                    onClick={handleAdd}
                    aria-label="Ajouter un nouveau produit"
                    disabled={submitLoading}
                  >
                    <Icon>add</Icon> Nouveau Produit
                  </MDButton>
                </MDBox>
              </MDBox>

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
                      placeholder="Rechercher (référence, nom, etc.)"
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
                      Fournisseur
                    </MDTypography>
                    <Select
                      fullWidth
                      value={filterFournisseur}
                      onChange={(e) => setFilterFournisseur(e.target.value)}
                      displayEmpty
                      variant="outlined"
                    >
                      <MenuItem value="">Tous</MenuItem>
                      {uniqueFournisseurs.map((fournisseur) => (
                        <MenuItem key={fournisseur._id} value={fournisseur._id}>
                          {fournisseur.nom}
                        </MenuItem>
                      ))}
                    </Select>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <MDTypography variant="body2" fontWeight="bold" mb={1}>
                      Stock Min
                    </MDTypography>
                    <TextField
                      fullWidth
                      type="number"
                      value={minStock}
                      onChange={(e) => setMinStock(e.target.value)}
                      variant="outlined"
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <MDTypography variant="body2" fontWeight="bold" mb={1}>
                      Stock Max
                    </MDTypography>
                    <TextField
                      fullWidth
                      type="number"
                      value={maxStock}
                      onChange={(e) => setMaxStock(e.target.value)}
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
                  <CircularProgress />
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
            <MDTypography variant="h5" id="produitModalLabel">
              {isEditing ? "Modifier un produit" : "Ajouter un nouveau produit"}
            </MDTypography>
            <IconButton
              onClick={() => setShowModal(false)}
              aria-label="Fermer"
              disabled={submitLoading}
            >
              <Icon>close</Icon>
            </IconButton>
          </MDBox>
          <form onSubmit={(e) => handleSubmit(e)}>
            <Grid container spacing={2}>
              {[
                { label: "Nom du Produit", name: "nomProduit", type: "text", required: true },
                { label: "Catégorie", name: "categorie", type: "text" },
                { label: "Description", name: "description", type: "text" },
                {
                  label: "Prix d'Achat (DT)",
                  name: "prixAchat",
                  type: "number",
                  min: 0.01,
                  step: "0.01",
                  required: true,
                },
                {
                  label: "Prix Unitaire HT (DT)",
                  name: "prixUnitaireHT",
                  type: "number",
                  min: 0.01,
                  step: "0.01",
                  required: true,
                },
                {
                  label: "Marge de Gagnante (%)",
                  name: "margeDegagnante",
                  type: "number",
                  min: 0,
                  step: "0.01",
                  required: true,
                },
                {
                  label: "TVA Applicable (%)",
                  name: "tvaApplicable",
                  type: "number",
                  min: 0,
                  step: "0.01",
                  required: true,
                },
                { label: "Stock Actuel", name: "stockActuel", type: "number", min: 0 },
                { label: "Stock Minimal", name: "stockMinimal", type: "number", min: 0 },
                {
                  label: "Seuil de Réapprovisionnement",
                  name: "seuilReapprovisionnement",
                  type: "number",
                  min: 0,
                },
                { label: "Quantité", name: "quantite", type: "number", min: 0 },
                {
                  label: "Stock Avant Mouvement",
                  name: "stockAvantMouvement",
                  type: "number",
                  min: 0,
                },
                {
                  label: "Stock Après Mouvement",
                  name: "stockApresMouvement",
                  type: "number",
                  min: 0,
                },
                { label: "Recherche (séparé par virgules)", name: "recherche", type: "text" },
                {
                  label: "Recherche Correspondance (séparé par virgules)",
                  name: "rechercheCorrespondance",
                  type: "text",
                },
              ].map(({ label, name, type, min, step, required }) => (
                <Grid item xs={6} key={name}>
                  <MDTypography variant="body2" fontWeight="bold" mb={1}>
                    {label} {required && <span style={{ color: "red" }}>*</span>}
                  </MDTypography>
                  <TextField
                    fullWidth
                    type={type}
                    id={name}
                    name={name}
                    value={currentProduit[name] ?? ""}
                    onChange={handleInputChange}
                    variant="outlined"
                    required={required}
                    inputProps={{ min, step }}
                    aria-required={required}
                    aria-describedby={`${name}-error`}
                    disabled={submitLoading}
                  />
                </Grid>
              ))}
              <Grid item xs={6}>
                <MDTypography variant="body2" fontWeight="bold" mb={1}>
                  Fournisseur Principal
                </MDTypography>
                <Select
                  fullWidth
                  name="fournisseurPrincipal"
                  value={currentProduit.fournisseurPrincipal || ""}
                  onChange={handleInputChange}
                  variant="outlined"
                  displayEmpty
                  disabled={submitLoading}
                >
                  <MenuItem value="">Aucun</MenuItem>
                  {fournisseurs.map((fournisseur) => (
                    <MenuItem key={fournisseur._id} value={fournisseur._id}>
                      {fournisseur.nomRaisonSociale}
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
            {submitLoading && (
              <MDBox mt={2} display="flex" justifyContent="center">
                <CircularProgress size={24} />
              </MDBox>
            )}
            <MDBox mt={3} display="flex" justifyContent="flex-end" gap={2}>
              {retryButtonVisible && (
                <MDButton
                  variant="outlined"
                  color="info"
                  onClick={handleManualRetry}
                  disabled={submitLoading}
                >
                  Réessayer
                </MDButton>
              )}
              <MDButton
                variant="outlined"
                color="secondary"
                onClick={() => setShowModal(false)}
                disabled={submitLoading}
              >
                Annuler
              </MDButton>
              <MDButton variant="gradient" color="info" type="submit" disabled={submitLoading}>
                {submitLoading
                  ? "Enregistrement en cours..."
                  : isEditing
                  ? "Mettre à jour"
                  : "Enregistrer"}
              </MDButton>
            </MDBox>
          </form>
        </MDBox>
      </Modal>

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
                label: "Prix d'Achat (DT)",
                value: currentProduit.prixAchat
                  ? Number(currentProduit.prixAchat).toFixed(2)
                  : "N/A",
              },
              {
                label: "Prix Unitaire HT (DT)",
                value: currentProduit.prixUnitaireHT
                  ? Number(currentProduit.prixUnitaireHT).toFixed(2)
                  : "N/A",
              },
              {
                label: "Marge de Gagnante (%)",
                value: currentProduit.margeDegagnante
                  ? Number(currentProduit.margeDegagnante).toFixed(2)
                  : "N/A",
              },
              {
                label: "TVA Applicable (%)",
                value: currentProduit.tvaApplicable
                  ? Number(currentProduit.tvaApplicable).toFixed(2)
                  : "N/A",
              },
              { label: "Stock Actuel", value: currentProduit.stockActuel || "0" },
              { label: "Stock Minimal", value: currentProduit.stockMinimal || "0" },
              {
                label: "Seuil de Réapprovisionnement",
                value: currentProduit.seuilReapprovisionnement || "0",
              },
              { label: "Quantité", value: currentProduit.quantite || "0" },
              { label: "Stock Avant Mouvement", value: currentProduit.stockAvantMouvement || "0" },
              { label: "Stock Après Mouvement", value: currentProduit.stockApresMouvement || "0" },
              { label: "Recherche", value: currentProduit.recherche || "N/A" },
              {
                label: "Recherche Correspondance",
                value: currentProduit.rechercheCorrespondance || "N/A",
              },
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

      <Modal open={showCalcModal} onClose={() => setShowCalcModal(false)}>
        <MDBox sx={modalStyle}>
          <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <MDTypography variant="h5" id="calcModalLabel">
              Calculatrice de Prix
            </MDTypography>
            <IconButton onClick={() => setShowCalcModal(false)} aria-label="Fermer">
              <Icon>close</Icon>
            </IconButton>
          </MDBox>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <MDTypography variant="body2" fontWeight="bold" mb={1}>
                Nom du Produit
              </MDTypography>
              <TextField
                fullWidth
                value={calcState.produit?.nomProduit || "N/A"}
                variant="outlined"
                InputProps={{ readOnly: true }}
                aria-readonly="true"
              />
            </Grid>
            <Grid item xs={6}>
              <MDTypography variant="body2" fontWeight="bold" mb={1}>
                Référence Produit
              </MDTypography>
              <TextField
                fullWidth
                value={calcState.produit?.referenceProduit || "N/A"}
                variant="outlined"
                InputProps={{ readOnly: true }}
                aria-readonly="true"
              />
            </Grid>
            <Grid item xs={6}>
              <MDTypography variant="body2" fontWeight="bold" mb={1}>
                Prix Unitaire HT (DT)
              </MDTypography>
              <TextField
                fullWidth
                value={(calcState.produit?.prixUnitaireHT || 0).toFixed(2)}
                variant="outlined"
                InputProps={{ readOnly: true }}
                aria-readonly="true"
              />
            </Grid>
            <Grid item xs={6}>
              <MDTypography variant="body2" fontWeight="bold" mb={1}>
                TVA Applicable (%)
              </MDTypography>
              <TextField
                fullWidth
                value={(calcState.produit?.tvaApplicable || 0).toFixed(2)}
                variant="outlined"
                InputProps={{ readOnly: true }}
                aria-readonly="true"
              />
            </Grid>
            <Grid item xs={6}>
              <MDTypography variant="body2" fontWeight="bold" mb={1}>
                Quantité
              </MDTypography>
              <TextField
                fullWidth
                type="number"
                name="quantity"
                value={calcState.quantity}
                onChange={handleCalcInputChange}
                variant="outlined"
                inputProps={{ min: 1, step: 1 }}
                aria-describedby="quantity-error"
              />
            </Grid>
            <Grid item xs={6}>
              <MDTypography variant="body2" fontWeight="bold" mb={1}>
                Remise (%)
              </MDTypography>
              <TextField
                fullWidth
                type="number"
                name="discount"
                value={calcState.discount}
                onChange={handleCalcInputChange}
                variant="outlined"
                inputProps={{ min: 0, max: 100, step: "0.01" }}
                aria-describedby="discount-error"
              />
            </Grid>
            <Grid item xs={6}>
              <MDTypography variant="body2" fontWeight="bold" mb={1}>
                Prix Unitaire Après Remise (DT)
              </MDTypography>
              <TextField
                fullWidth
                value={calcState.unitPriceAfterDiscount.toFixed(2)}
                variant="outlined"
                InputProps={{ readOnly: true }}
                aria-readonly="true"
              />
            </Grid>
            <Grid item xs={6}>
              <MDTypography variant="body2" fontWeight="bold" mb={1}>
                Prix Total TTC (DT)
              </MDTypography>
              <TextField
                fullWidth
                value={calcState.totalPrice.toFixed(2)}
                variant="outlined"
                InputProps={{ readOnly: true }}
                aria-readonly="true"
              />
            </Grid>
            <Grid item xs={12}>
              <MDBox display="flex" justifyContent="center" gap={2}>
                <MDButton
                  variant="gradient"
                  color="info"
                  onClick={() => handleCalcOperation("add")}
                >
                  +1
                </MDButton>
                <MDButton
                  variant="gradient"
                  color="warning"
                  onClick={() => handleCalcOperation("subtract")}
                  disabled={calcState.quantity <= 1}
                >
                  -1
                </MDButton>
                <MDButton
                  variant="gradient"
                  color="secondary"
                  onClick={() => handleCalcOperation("reset")}
                >
                  Réinitialiser Remise
                </MDButton>
              </MDBox>
            </Grid>
          </Grid>
          {error && (
            <MDBox mt={2}>
              <MDTypography variant="body2" color="error">
                {error}
              </MDTypography>
            </MDBox>
          )}
          <MDBox mt={3} display="flex" justifyContent="flex-end">
            <MDButton variant="outlined" color="secondary" onClick={() => setShowCalcModal(false)}>
              Fermer
            </MDButton>
          </MDBox>
        </MDBox>
      </Modal>

      <Footer />
    </DashboardLayout>
  );
};

export default ProduitComponent;
