# Composable MES: Warehouse, Production, QMS & Andon Integration Guide

This guide describes how the Composable MES application suites (Inventory, Production, QMS, and Andon) correlate with each other. Together, they form an enterprise-grade digital ecosystem for discrete manufacturing operations—covering the entire lifecycle of material receiving, bin replenishment, production line execution, machine downtime monitoring, visual quality inspections, and corrective action loops.

---

## 🌐 Complete Factory Operational Loop Diagram

The following diagram illustrates how raw materials flow into the shopfloor, how order execution consumes them, how Andon alerts interrupt production during downtime, and how quality inspectors log defects and raise CAPAs when assembly standards are violated.

```mermaid
graph TD
    %% Styling
    classDef warehouse fill:#f0fdfa,stroke:#0d9488,stroke-width:2px,color:#0f172a;
    classDef shopfloor fill:#f0f9ff,stroke:#0284c7,stroke-width:2px,color:#0f172a;
    classDef production fill:#fff7ed,stroke:#ea580c,stroke-width:2px,color:#0f172a;
    classDef quality fill:#fffbeb,stroke:#d97706,stroke-width:2px,color:#0f172a;
    classDef analytics fill:#f5f3ff,stroke:#7c3aed,stroke-width:2px,color:#0f172a;

    %% 1. Warehouse and Inventory Ingestion
    subgraph WR [1. Warehouse and Inventory Ingestion]
        A["Material Loading and Receiving App"] -->|1. Receives and Scans| B("Inventory Items Table")
        C["Material Warehouse App"] -->|2. Moves and Transfers Bins| B
        D["Inventory Management App"] -->|3. Configures Kanban Loops| B
    end
    class A,C,D WR warehouse;

    %% 2. Shopfloor Replenishment Loop
    subgraph SR [2. Production Line Replenishment Loop]
        E["Material Request App"] -->|4. Scans Empty Bin or Request| F("Material Requests Table")
        G["Replenishment App"] -->|5. Fulfills and Dispatches Bins| F
        H["Material Handling App"] -->|6. Compiles Picklists and Delivers| F
    end
    class E,G,H SR shopfloor;

    %% 3. Production Execution and Andon Downtime
    subgraph PE [3. Production Line Execution and Andon]
        O["Order Execution App"] -->|7. Loads Released Orders| P("Work Orders Table")
        O -->|8. Logs Assembly Units| Q("Production Counts / Units Table")
        O -->|9. Consumes Stock| B
        R["Andon Terminal App"] -->|10. Creates Downtime Alert| S("Actions Table")
        R -->|11. Stops Production| T("Stations Table")
        U["Andon Management App"] -->|12. Resolves downtime| S
        U -->|13. Restarts Station| T
    end
    class O,R,U PE production;

    %% 4. Quality and Deviation Management
    subgraph QD [4. Frontline Quality QMS and Inspections]
        I["Quality Inspection Suite"] -->|14. Verifies Finished Assemblies| J("Inspection Results Table")
        I -->|15. Detects Failures| K("Defect Events Table")
        L["Frontline QMS App"] -->|16. Disposisi MRB Scrap-Rework-UseAsIs| K
        L -->|17. Triggers Root-Cause Resolution| M("CAPA Incidents Table")
    end
    class I,L QD quality;

    %% 5. Operations Analytics
    subgraph OA [5. Operations Analytics and Leadership Control]
        N["Inventory Dashboard App"] -->|18. Pulls Cycle Time Metrics| F
        V["Operations Management Dashboard"] -->|19. Monitore OEE, Production Output, and Downtime| Q
        V -->|20. Pulls Station States| T
    end
    class N,V OA analytics;

    %% Inter-subgraph relationships
    B ====>|Provides stock availability| E
    F ====>|Signals need for movement| C
    Q ====>|Triggers final part inspection| I
    J ====>|Logs defect triggers| K
    T ====>|Blocks work order completion| O
```

---

## 📋 Comprehensive Operational Scenarios

### Scenario A: Warehouse Stock Ingestion & Management
1. **Material Loading & Receiving**: High-volume components arrive at the dock. Forklift operators scan barcodes to ingest parts into `Inventory_Items`.
2. **Material Warehouse**: Warehouse operators execute bin movements to store the parts on stockroom shelves.
3. **Inventory Management**: Masters inventory configurations, sets active Kanban bin quantities, and links vendor lead times.

### Scenario B: Kanban Replenishment & Production Consumption
1. **Production Consumes Stock**: The operator uses the **Order Execution** app to assemble products. Every completed assembly deducts physical parts (screws, cylinders) from the `Inventory_Items` table.
2. **Material Request (Kanban Scan)**: When an assembly parts bin goes empty, the operator scans the bin's barcode. The system instantly generates a replenishment request in `Material_Requests`.
3. **Replenishment & Material Handling**: The mini-warehouse compiles the picklist, and a logistics runner (*Water Spider*) delivers a fresh bin to the station, changing the request status to `COMPLETED`.

### Scenario C: Production Blockage & Andon Escalation
1. **Downtime Event**: During assembly, a critical torque tool fails. The operator cannot proceed.
2. **Andon Terminal**: The operator taps **Create Andon** on their terminal. The app sets the station state to `DOWN` in the `Stations` table and inserts an active downtime event in the `Actions` table. This instantly freezes the operator's **Order Execution** screen.
3. **Andon Management**: The area supervisor receives a visual push notification. They proceed to the station, swap the torque tool, log comments, and mark the alert as `RESOLVED`. The station status returns to `RUNNING`, allowing the operator to resume assembly.

### Scenario D: Frontline Quality Control & MRB Deviation Loops
1. **Quality Inspection Suite**: Upon finishing an assembly, the unit goes through a quality gate. The inspector checks the unit against numerical limits (e.g. pressure checks) or visual cylinder references.
2. **Defect Log**: If the unit fails alignment checks, the inspection engine marks the status as `FAILED` and raises a ticket in the `Defect_Events` table.
3. **Frontline QMS (MRB & CAPA)**: The Material Review Board opens the active defect list:
    * **Mark as scrap**: The unit is thrown away; the inventory is written off.
    * **Send to rework**: The unit goes back to the rework bench.
    * **Use-as-is**: Approved deviation.
    * **Raise CAPA**: Quality engineering runs a 5-Why analysis to implement physical corrective plans, preventing future assembly defects.

### Scenario E: Leadership Visibility & Performance Diagnostics
1. **Inventory Dashboard**: Monitors material request duration to identify logistics bottlenecks.
2. **Operations Management Dashboard**: Monitors hourly production rates against targets, OEE (Overall Equipment Effectiveness) scores, active machine downtime distributions, and primary defect categories.

---

> [!IMPORTANT]
> All custom tables (like `Work_Orders`, `Stations`, `Defect_Events`, `Material_Requests`, and `Actions`) share standardized name keys across these apps. This allows the entire suite of applications to act as a single unified brain on your factory floor!
