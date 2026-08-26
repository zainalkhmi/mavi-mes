# Data Processing Agreement (DPA)

**Effective Date:** [DATE]

This Data Processing Agreement ("DPA") forms part of the Terms of Service or other agreement between [Company Name] ("Data Processor") and the customer ("Data Controller") governing the processing of personal data.

## 1. Definitions

| Term | Definition |
|------|------------|
| **Personal Data** | Any information relating to an identified or identifiable natural person |
| **Data Subject** | An identified or identifiable natural person |
| **Processing** | Any operation performed on Personal Data |
| **Controller** | Entity determining purposes and means of Processing |
| **Processor** | Entity processing Personal Data on behalf of Controller |
| **Sub-processor** | Third party engaged by Processor |

## 2. Scope and Purpose

### 2.1 Subject Matter
This DPA covers the processing of Personal Data in connection with the Mavi MES service.

### 2.2 Nature and Purpose
Processing is limited to:
- Storage and retrieval
- Organizational management
- Service delivery and improvement
- Security and compliance

### 2.3 Categories of Data Subjects
- Users of the Service (employees, contractors)
- Data uploaded by Users
- Customer representatives

### 2.4 Categories of Personal Data
| Category | Examples |
|----------|----------|
| Identity | Name, email, user ID |
| Contact | Email address, phone |
| Profile | Role, organization |
| Usage | Activity logs, preferences |
| Technical | IP address, device info |

## 3. Responsibilities of Controller

### 3.1 Lawfulness
The Controller shall ensure:
- Lawful basis for processing (consent, contract, legitimate interest)
- Data Subject rights are honored
- Data collection is limited to necessity

### 3.2 Instructions
The Controller provides instructions to Processor through:
- This DPA
- Service configuration
- Written communications

## 4. Responsibilities of Processor

### 4.1 Processing Limitations
The Processor shall:
- Process Personal Data only on documented instructions
- Not transfer data to third countries without authorization
- Not engage sub-processors without consent

### 4.2 Personnel
Processor personnel:
- Are bound by confidentiality
- Receive appropriate training
- Have access only on need-to-know basis

### 4.3 Security Measures
The Processor implements:
| Measure | Implementation |
|---------|---------------|
| Pseudonymization | Data separation by organization |
| Encryption | TLS in transit, encrypted storage |
| Confidentiality | Access controls, NDAs |
| Availability | Backup systems, disaster recovery |
| Resilience | High availability architecture |
| Assessment | Regular security reviews |

## 5. Sub-processors

### 5.1 Authorized Sub-processors

| Sub-processor | Purpose | Location |
|---------------|---------|----------|
| Supabase | Database and authentication | [EU/US] |
| Vercel | Hosting and CDN | [US] |
| Sentry | Error tracking | [US] |

### 5.2 Notification
The Processor notifies Controller of new sub-processors with 7 days notice.

### 5.3 Objection Right
Controller may object to new sub-processors. Processor's failure to object constitutes acceptance.

### 5.4 Sub-processor Obligations
Sub-processors are bound by equivalent obligations as Processor.

## 6. Data Subject Rights

### 6.1 Assistance Obligations
The Processor shall assist Controller in fulfilling:
- Information requests
- Access requests
- Rectification requests
- Erasure requests ("right to be forgotten")
- Restriction requests
- Data portability requests
- Objection handling

### 6.2 Response Times
The Processor responds to Controller requests within 7 days.

## 7. Security Incidents

### 7.1 Detection
The Processor implements:
- Intrusion detection systems
- Log monitoring
- Regular vulnerability scans

### 7.2 Notification
Upon discovery of a Security Incident:
1. Processor notifies Controller within **48 hours**
2. Notification includes:
   - Nature of the breach
   - Categories and approximate number of Data Subjects
   - Categories and approximate number of Personal Data records
   - Likely consequences
   - Measures taken or proposed

### 7.3 Documentation
The Processor maintains documentation of all Security Incidents.

## 8. Audits

### 8.1 Audit Rights
The Controller may audit Processor compliance by:
- Requesting compliance reports (SOC 2, ISO 27001)
- On-site audits with **30 days notice** (maximum 1 per year)

### 8.2 Audit Costs
Controller bears costs of audits. Processor provides reasonable cooperation.

## 9. Data Transfers

### 9.1 Transfer Mechanisms
Transfers outside the EEA use:
- Standard Contractual Clauses (SCCs)
- Adequacy decisions
- Binding Corporate Rules

### 9.2 Transfer Documentation
The Processor maintains records of international transfers.

## 10. Deletion and Return

### 10.1 Upon Termination
The Processor shall, at Controller's choice:
- Delete all Personal Data within **30 days**, or
- Return all Personal Data in portable format

### 10.2 Exceptions
Deletion may be delayed if:
- Required by law
- Necessary for legal claims

### 10.3 Verification
Processor provides certificate of deletion upon request.

## 11. Liability

### 11.1 Processor Liability
The Processor is liable for:
- Damages caused by unlawful processing
- Failure to implement appropriate security measures

### 11.2 Limitation
Processor's total liability is limited to fees paid in the 12 months preceding the claim.

## 12. Governing Law

This DPA is governed by the laws of [JURISDICTION].

## 13. Contact

### Processor Contact
**Email:** [PRIVACY@YOURCOMPANY.COM]
**Address:** [ADDRESS]

### Data Protection Officer
**Email:** [DPO@YOURCOMPANY.COM]

## Annex 1: Technical and Organizational Measures

### Physical Security
- Access controls for data centers
- 24/7 monitoring
- Environmental controls

### Logical Security
- Encryption (AES-256)
- Network segmentation
- Firewall and IDS/IPS
- Regular penetration testing

### Organizational Measures
- Security policies
- Employee training
- Incident response procedures
- Vendor management

## Annex 2: Sub-processor List

Current authorized sub-processors:

| Name | Service | Data Processed | Location |
|------|---------|----------------|----------|
| Supabase | Database, Auth | All user data | EU/US |
| Vercel | Hosting, CDN | All data | US |
| Sentry | Error tracking | Error logs | US |
| OpenAI | AI features | User prompts | US |

---

*Signed:*

**For Processor:**
[COMPANY NAME]

Signature: _______________________

Name: ___________________________

Date: ___________________________

**For Controller:**
[CUSTOMER COMPANY]

Signature: _______________________

Name: ___________________________

Date: ___________________________
