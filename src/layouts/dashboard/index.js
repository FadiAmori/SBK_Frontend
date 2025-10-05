/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Grid, Select, MenuItem, CircularProgress, TextField, IconButton } from "@mui/material";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";

function Dashboard() {
  const [clients, setClients] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [produits, setProduits] = useState([]);
  const [factures, setFactures] = useState([]);
  const [facturesAchat, setFacturesAchat] = useState([]);
  const [resumesComptables, setResumesComptables] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [periodeType, setPeriodeType] = useState("month");
  const [editingId, setEditingId] = useState(null);
  const [editFraisGeneraux, setEditFraisGeneraux] = useState("");

  // Refresh data every 30 seconds
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          clientsRes,
          fournisseursRes,
          produitsRes,
          facturesRes,
          facturesAchatRes,
          resumesRes,
        ] = await Promise.all([
          axios.get("https://sbk-1.onrender.com/api/clients"),
          axios.get("https://sbk-1.onrender.com/api/fournisseurs"),
          axios.get("https://sbk-1.onrender.com/api/produits"),
          axios.get("https://sbk-1.onrender.com/api/factures"),
          axios.get("https://sbk-1.onrender.com/api/factureAchats"),
          axios.get("https://sbk-1.onrender.com/api/resumes-comptables"),
          axios.post("https://sbk-1.onrender.com/api/resumes-comptables"), // Generate résumés
        ]);
        setClients(Array.isArray(clientsRes.data) ? clientsRes.data : [clientsRes.data]);
        setFournisseurs(
          Array.isArray(fournisseursRes.data) ? fournisseursRes.data : [fournisseursRes.data]
        );
        setProduits(Array.isArray(produitsRes.data) ? produitsRes.data : [produitsRes.data]);
        setFactures(Array.isArray(facturesRes.data) ? facturesRes.data : [facturesRes.data]);
        setFacturesAchat(
          Array.isArray(facturesAchatRes.data) ? facturesAchatRes.data : [facturesAchatRes.data]
        );
        setResumesComptables(Array.isArray(resumesRes.data) ? resumesRes.data : [resumesRes.data]);
        setError("");
      } catch (err) {
        setError(
          err.response?.data?.error || "Échec de la récupération des données. Réessayez plus tard."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData(); // Initial fetch
    const intervalId = setInterval(fetchData, 30000); // Refresh every 30 seconds

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  // Validate startDate and endDate
  const isValidDateRange = () => {
    if (!startDate || !endDate) return true; // Allow empty dates
    return new Date(startDate) <= new Date(endDate);
  };

  // Filter factures based on date range
  const filteredFactures = useMemo(() => {
    return factures.filter((f) => {
      const factureDate = new Date(f.dateFacturation);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      return (!start || factureDate >= start) && (!end || factureDate <= end);
    });
  }, [factures, startDate, endDate]);

  // Filter résumés based on period and type
  const filteredResumes = useMemo(() => {
    return resumesComptables.filter((resume) => {
      const resumeDate = new Date(resume.periode);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && end && (resumeDate < start || resumeDate > end)) {
        return false;
      }
      if (periodeType && resume.periodeType !== periodeType) {
        return false;
      }
      return true;
    });
  }, [resumesComptables, startDate, endDate, periodeType]);

  // Handle editing fraisGeneraux
  const handleEditFraisGeneraux = (resume) => {
    setEditingId(resume._id);
    setEditFraisGeneraux(resume.fraisGeneraux.toString());
  };

  const handleSaveFraisGeneraux = async (id) => {
    try {
      const fraisGeneraux = parseFloat(editFraisGeneraux);
      if (isNaN(fraisGeneraux) || fraisGeneraux < 0) {
        setError("Frais généraux doit être un nombre positif.");
        return;
      }
      await axios.put(`https://sbk-1.onrender.com/api/resumes-comptables/${id}`, { fraisGeneraux });
      setResumesComptables((prev) =>
        prev.map((resume) =>
          resume._id === id
            ? { ...resume, fraisGeneraux, resultatNet: resume.margeBrute - fraisGeneraux }
            : resume
        )
      );
      setEditingId(null);
      setEditFraisGeneraux("");
    } catch (err) {
      setError(err.response?.data?.error || "Échec de la mise à jour des frais généraux.");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFraisGeneraux("");
  };

  // Calculate totals
  const totalClients = clients.length || 0;
  const totalFournisseurs = fournisseurs.length || 0;
  const totalProduits = produits.length || 0;

  // Calculate client sales percentages
  const clientPurchaseData = useMemo(() => {
    return clients
      .map((client) => {
        const totalMontantTTC = filteredFactures
          .filter((f) => (f.client?._id || f.client) === client._id)
          .reduce((sum, f) => sum + (f.montantTTC || 0), 0);
        return { name: client.nomRaisonSociale || "Inconnu", value: totalMontantTTC };
      })
      .filter((d) => d.value > 0);
  }, [clients, filteredFactures]);

  // Calculate supplier purchase percentages
  const fournisseurPurchaseData = useMemo(() => {
    return fournisseurs
      .map((fournisseur) => {
        const totalMontantTTC = facturesAchat
          .filter((f) => (f.fournisseur?._id || f.fournisseur) === fournisseur._id)
          .reduce((sum, f) => sum + (f.montantTTC || 0), 0);
        return { name: fournisseur.nomRaisonSociale || "Inconnu", value: totalMontantTTC };
      })
      .filter((d) => d.value > 0);
  }, [fournisseurs, facturesAchat]);

  // Calculate product sales percentages based on monetary value
  const productSalesData = useMemo(() => {
    return produits
      .map((produit) => {
        const totalSalesValue = filteredFactures.reduce((sum, f) => {
          const productItems =
            f.liste?.filter((item) => (item.produit?._id || item.produit) === produit._id) || [];
          return (
            sum +
            productItems.reduce((acc, item) => {
              const quantity = item.quantite || 0;
              const price = item.produit?.prixUnitaireHT || produit.prixUnitaireHT || 0;
              return acc + quantity * price;
            }, 0)
          );
        }, 0);
        return { name: produit.nomProduit || "Produit Inconnu", value: totalSalesValue };
      })
      .filter((d) => d.value > 0);
  }, [produits, filteredFactures]);

  // Calculate invoices per day for selected client
  const getInvoicesPerDay = () => {
    if (!selectedClient) return [];
    const clientFactures = filteredFactures.filter(
      (f) => (f.client?._id || f.client) === selectedClient
    );
    const invoiceCounts = {};

    clientFactures.forEach((facture) => {
      const date = new Date(facture.dateFacturation).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      invoiceCounts[date] = (invoiceCounts[date] || 0) + 1;
    });

    return Object.entries(invoiceCounts).map(([date, count]) => ({ date, count }));
  };

  const COLORS = ["#4CAF50", "#2196F3", "#FF9800", "#9C27B0", "#F44336"];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3} px={2}>
        <MDTypography variant="h3" fontWeight="bold" color="text.primary" mb={4}>
          Tableau de Bord - Analyse Financière
        </MDTypography>
        {error && (
          <MDBox mb={3} p={2} sx={{ backgroundColor: "#ffebee", borderRadius: 1 }}>
            <MDTypography variant="body2" color="error" fontWeight="medium">
              {error}{" "}
              <MDButton
                variant="text"
                color="error"
                size="small"
                onClick={() => window.location.reload()}
              >
                Réessayer
              </MDButton>
            </MDTypography>
          </MDBox>
        )}
        {!isValidDateRange() && (
          <MDBox mb={3} p={2} sx={{ backgroundColor: "#ffebee", borderRadius: 1 }}>
            <MDTypography variant="body2" color="error" fontWeight="medium">
              La date de début doit être antérieure ou égale à la date de fin.
            </MDTypography>
          </MDBox>
        )}

        <>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <ComplexStatisticsCard
                color="dark"
                icon="person"
                title="Nombre de Clients"
                count={totalClients}
                percentage={{ color: "success", amount: "", label: "Total" }}
                sx={{ height: "100%" }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <ComplexStatisticsCard
                color="success"
                icon="store"
                title="Nombre de Fournisseurs"
                count={totalFournisseurs}
                percentage={{ color: "success", amount: "", label: "Total" }}
                sx={{ height: "100%" }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <ComplexStatisticsCard
                color="primary"
                icon="inventory"
                title="Nombre de Produits"
                count={totalProduits}
                percentage={{ color: "success", amount: "", label: "Total" }}
                sx={{ height: "100%" }}
              />
            </Grid>
          </Grid>

          <MDBox mt={6}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <MDBox mb={3} p={2} sx={{ backgroundColor: "#fff", borderRadius: 2, boxShadow: 1 }}>
                  <MDTypography variant="h6" fontWeight="bold" color="text.primary" mb={2}>
                    Répartition des Ventes par Client (%)
                  </MDTypography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={clientPurchaseData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#4CAF50"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                      >
                        {clientPurchaseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value.toFixed(2)} DT`} />
                      <Legend wrapperStyle={{ fontSize: "14px", paddingTop: "10px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </MDBox>
              </Grid>
              <Grid item xs={12} md={4}>
                <MDBox mb={3} p={2} sx={{ backgroundColor: "#fff", borderRadius: 2, boxShadow: 1 }}>
                  <MDTypography variant="h6" fontWeight="bold" color="text.primary" mb={2}>
                    Répartition des Achats par Fournisseur (%)
                  </MDTypography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={fournisseurPurchaseData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#2196F3"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                      >
                        {fournisseurPurchaseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value.toFixed(2)} DT`} />
                      <Legend wrapperStyle={{ fontSize: "14px", paddingTop: "10px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </MDBox>
              </Grid>
              <Grid item xs={12} md={4}>
                <MDBox mb={3} p={2} sx={{ backgroundColor: "#fff", borderRadius: 2, boxShadow: 1 }}>
                  <MDTypography variant="h6" fontWeight="bold" color="text.primary" mb={2}>
                    Répartition des Ventes par Produit (%)
                  </MDTypography>
                  {productSalesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={productSalesData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#FF9800"
                          labelLine={false}
                          label={({ name, percent, value }) =>
                            `${name} (${(percent * 100).toFixed(1)}%, ${value.toFixed(2)} DT)`
                          }
                        >
                          {productSalesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value.toFixed(2)} DT`} />
                        <Legend wrapperStyle={{ fontSize: "14px", paddingTop: "10px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <MDTypography variant="body2" color="text.secondary">
                      Aucune donnée disponible pour les ventes par produit.
                    </MDTypography>
                  )}
                </MDBox>
              </Grid>
            </Grid>
          </MDBox>

          <MDBox mt={6}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <MDBox mb={3} p={2} sx={{ backgroundColor: "#fff", borderRadius: 2, boxShadow: 1 }}>
                  <MDTypography variant="h6" fontWeight="bold" color="text.primary" mb={2}>
                    Résumé Comptable
                  </MDTypography>
                  <Grid container spacing={2} mb={2}>
                    <Grid item xs={12} sm={4}>
                      <MDTypography variant="body2" fontWeight="bold" mb={1}>
                        Date de début
                      </MDTypography>
                      <TextField
                        fullWidth
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <MDTypography variant="body2" fontWeight="bold" mb={1}>
                        Date de fin
                      </MDTypography>
                      <TextField
                        fullWidth
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <MDTypography variant="body2" fontWeight="bold" mb={1}>
                        Type de période
                      </MDTypography>
                      <Select
                        fullWidth
                        value={periodeType}
                        onChange={(e) => setPeriodeType(e.target.value)}
                      >
                        <MenuItem value="month">Mensuel</MenuItem>
                        <MenuItem value="quarter">Trimestriel</MenuItem>
                      </Select>
                    </Grid>
                  </Grid>
                  {filteredResumes.length > 0 ? (
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontFamily: "Arial, sans-serif",
                      }}
                    >
                      <thead>
                        <tr style={{ backgroundColor: "#f5f5f5" }}>
                          <th
                            style={{
                              border: "1px solid #ddd",
                              padding: "8px",
                              fontWeight: "bold",
                              color: "#333",
                            }}
                          >
                            Période
                          </th>
                          <th
                            style={{
                              border: "1px solid #ddd",
                              padding: "8px",
                              fontWeight: "bold",
                              color: "#333",
                            }}
                          >
                            Chiffre d’affaires
                          </th>
                          <th
                            style={{
                              border: "1px solid #ddd",
                              padding: "8px",
                              fontWeight: "bold",
                              color: "#333",
                            }}
                          >
                            Achats
                          </th>
                          <th
                            style={{
                              border: "1px solid #ddd",
                              padding: "8px",
                              fontWeight: "bold",
                              color: "#333",
                            }}
                          >
                            Marge brute
                          </th>
                          <th
                            style={{
                              border: "1px solid #ddd",
                              padding: "8px",
                              fontWeight: "bold",
                              color: "#333",
                            }}
                          >
                            Frais généraux
                          </th>
                          <th
                            style={{
                              border: "1px solid #ddd",
                              padding: "8px",
                              fontWeight: "bold",
                              color: "#333",
                            }}
                          >
                            Résultat net
                          </th>
                          <th
                            style={{
                              border: "1px solid #ddd",
                              padding: "8px",
                              fontWeight: "bold",
                              color: "#333",
                            }}
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredResumes.map((resume) => (
                          <tr key={resume._id}>
                            <td
                              style={{
                                border: "1px solid #ddd",
                                padding: "8px",
                                textAlign: "center",
                              }}
                            >
                              {new Date(resume.periode).toLocaleString("fr-FR", {
                                month: resume.periodeType === "month" ? "long" : undefined,
                                quarter:
                                  resume.periodeType === "quarter"
                                    ? `T${Math.floor(new Date(resume.periode).getMonth() / 3) + 1}`
                                    : undefined,
                                year: "numeric",
                              })}
                            </td>
                            <td
                              style={{
                                border: "1px solid #ddd",
                                padding: "8px",
                                textAlign: "center",
                              }}
                            >
                              {(resume.chiffreAffaires || 0).toFixed(2)} DT
                            </td>
                            <td
                              style={{
                                border: "1px solid #ddd",
                                padding: "8px",
                                textAlign: "center",
                              }}
                            >
                              {(resume.achats || 0).toFixed(2)} DT
                            </td>
                            <td
                              style={{
                                border: "1px solid #ddd",
                                padding: "8px",
                                textAlign: "center",
                              }}
                            >
                              {(resume.margeBrute || 0).toFixed(2)} DT
                            </td>
                            <td
                              style={{
                                border: "1px solid #ddd",
                                padding: "8px",
                                textAlign: "center",
                              }}
                            >
                              {editingId === resume._id ? (
                                <TextField
                                  type="number"
                                  value={editFraisGeneraux}
                                  onChange={(e) => setEditFraisGeneraux(e.target.value)}
                                  size="small"
                                  inputProps={{ min: 0, step: "0.01" }}
                                  sx={{ width: "100px" }}
                                />
                              ) : (
                                `${(resume.fraisGeneraux || 0).toFixed(2)} DT`
                              )}
                            </td>
                            <td
                              style={{
                                border: "1px solid #ddd",
                                padding: "8px",
                                textAlign: "center",
                              }}
                            >
                              {(resume.resultatNet || 0).toFixed(2)} DT
                            </td>
                            <td
                              style={{
                                border: "1px solid #ddd",
                                padding: "8px",
                                textAlign: "center",
                              }}
                            >
                              {editingId === resume._id ? (
                                <>
                                  <IconButton
                                    color="success"
                                    onClick={() => handleSaveFraisGeneraux(resume._id)}
                                  >
                                    <SaveIcon />
                                  </IconButton>
                                  <IconButton color="error" onClick={handleCancelEdit}>
                                    <CancelIcon />
                                  </IconButton>
                                </>
                              ) : (
                                <IconButton
                                  color="warning"
                                  onClick={() => handleEditFraisGeneraux(resume)}
                                >
                                  <EditIcon />
                                </IconButton>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <MDTypography variant="body2" color="text.secondary" textAlign="center">
                      Aucune donnée comptable disponible pour la période sélectionnée.
                    </MDTypography>
                  )}
                </MDBox>
              </Grid>
            </Grid>
          </MDBox>
        </>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Dashboard;
