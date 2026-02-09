export const mockFormResult = {
    id: 123,
    fileName: "invoice_scan.jpg",
    status: "COMPLETED",
    extractedAt: "2024-02-15T12:00:00Z",
    structuredJson: {
        summary: "This is a medical invoice for patient John Doe covering consultation and lab fees.",
        document_type: "Medical Invoice",
        signatures_detected: true,
        sections: [
            {
                section_name: "Patient Information",
                fields: [
                    { field_name: "Patient Name", field_value: "John Doe", confidence: 0.98 },
                    { field_name: "DOB", field_value: "1985-05-12", confidence: 0.95 }
                ]
            },
            {
                section_name: "Billing Details",
                fields: [
                    { field_name: "Invoice Number", field_value: "INV-2024-001", confidence: 0.99 },
                    { field_name: "Total Amount", field_value: "$1,250.00", confidence: 0.96 }
                ]
            }
        ],
        tables: [
            {
                table_name: "Service Charges",
                headers: ["Service", "Code", "Price"],
                rows: [
                    { Service: "Consultation", Code: "C001", Price: "$500.00" },
                    { Service: "Lab Work", Code: "L055", Price: "$750.00" }
                ]
            }
        ],
        key_entities: {
            dates: ["2024-02-15"],
            organizations: ["City Hospital"]
        },
        unclearFields: []
    },
    rawText: "INVOICE\nCity Hospital\nPatient: John Doe\nTotal: $1,250.00"
};

export const mockHistory = [
    {
        id: 123,
        fileName: "invoice_scan.jpg",
        status: "COMPLETED",
        uploadedAt: "2024-02-15T10:00:00Z"
    },
    {
        id: 124,
        fileName: "pending_doc.pdf",
        status: "PROCESSING",
        uploadedAt: "2024-02-15T10:05:00Z"
    }
];
