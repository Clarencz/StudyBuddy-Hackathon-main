import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Trash, Download, Eye } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Documents = () => {
  const { apiCall } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      const data = await apiCall("/api/documents", { method: "GET" });
      setDocuments(data.documents);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch documents");
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
  };

  // Upload document
  const handleUpload = async () => {
    if (!file) return setError("Please select a file to upload");
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/documents/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setDocuments((prev) => [response.data.document, ...prev]);
      setFile(null);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  // Delete document
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document?"))
      return;
    try {
      await apiCall(`/api/documents/${id}`, { method: "DELETE" });
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      console.error(err);
      setError("Failed to delete document");
    }
  };

  // Download document
  const handleDownload = (doc) => {
    const url = `${import.meta.env.VITE_API_URL}/api/documents/${
      doc.id
    }/download`;
    window.open(url, "_blank");
  };

  // View flipbook
  const handleViewFlipbook = (doc) => {
    if (!doc.flipbook_url) return alert("Flipbook not available");
    const url = `${import.meta.env.VITE_API_URL}/api/documents/${
      doc.id
    }/flipbook`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold flex items-center">
        <FileText className="h-6 w-6 mr-2" /> Documents
      </h1>

      {/* Upload Section */}
      <Card className="p-4 flex items-center space-x-4">
        <Input type="file" onChange={handleFileChange} />
        <Button onClick={handleUpload} disabled={loading}>
          {loading ? "Uploading..." : "Upload"}
        </Button>
      </Card>
      {error && <p className="text-red-600">{error}</p>}

      {/* Documents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <Card key={doc.id} className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{doc.original_filename}</span>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleViewFlipbook(doc)}
                    title="View Flipbook"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(doc)}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(doc.id)}
                    title="Delete"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                {doc.document_type.toUpperCase()} | Pages:{" "}
                {doc.page_count || "N/A"} | Uploaded:{" "}
                {new Date(doc.created_at).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Documents;
