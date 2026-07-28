import type { Lesson } from "../course-data";

export type EnglishLessonContent = Pick<Lesson, "summary" | "explanation" | "deepDive" | "keyPoints" | "decisions" | "pitfalls" | "examDecision" | "checkpoint"> & {
  example: Pick<Lesson["example"], "title" | "note">;
};

/**
 * Full English editorial projection of the Spanish lesson source. Generated from
 * the versioned curriculum so English learners receive the same concepts,
 * mechanics, scenarios, and decisions instead of a generic template.
 */
export const englishLessonContent = {
  "m01-l1": {
    "summary": "A lakehouse combines the flexibility of a data lake with the controls and performance of a warehouse, keeping data in open formats.",
    "explanation": [
      "Separating storage and compute allows you to maintain a single governed copy of data and assign different engines to ETL, BI, or streaming. Object storage provides durability and elasticity; the compute is created, scaled, and terminated based on the load.",
      "Delta Lake adds transactional logging over Parquet files. Thus, a table can offer ACID, controlled schema evolution, and history without abandoning a format accessible by multiple engines. The value is not in bringing products together, but in reducing copies and operational boundaries."
    ],
    "deepDive": {
      "mentalModel": "Think of a lakehouse as a system of trusted tables built on top of object storage, not a superficial mix of data lake and warehouse. Storage keeps files cheap and durable; Delta Lake converts sets of those files into transactional snapshots; Unity Catalog assigns names, owners, and permissions; and different compute resources read the same logical state. This decoupling prevents the physical copy from belonging to a specific engine. To reason correctly, always separate four questions: where the bytes are persisted, what protocol defines a valid table, who can use it, and what engine executes the query. That separation simultaneously explains elasticity, interoperability, governance and recovery.",
      "mechanics": [
        "When a writer modifies a Delta table he does not edit a central file. It produces new Parquet files and proposes to the transaction log a set of actions that add and remove files from the snapshot. The accepted commit receives an ordered version. A reader chooses a consistent version and resolves its active files; That is why it does not observe partial writing. Object storage provides durability, while the Delta protocol provides the transactional meaning that a Parquet folder alone does not have.",
        "Separating compute allows a PySpark Job to transform overnight and a SQL warehouse to serve BI in the morning without moving the table. Each resource gets authorization through Unity Catalog and builds its own plan on top of the same snapshot. Turning off compute does not delete data or metadata. The economic benefit appears only if life cycles adjust to demand; keeping resources idle or duplicating tables per consumer defeats much of the lakehouse design."
      ],
      "concepts": [
        {
          "term": "Snapshot",
          "definition": "Immutable and consistent view of the active files of a table in a specific version of the transaction log.",
          "whyItMatters": "It explains why concurrent readers see complete and reproducible states."
        },
        {
          "term": "open format",
          "definition": "Documented representation of data and transactions that does not rely exclusively on a proprietary application for interpretation.",
          "whyItMatters": "Reduces copies and makes it easier for different engines to work on a common source."
        },
        {
          "term": "Storage-compute separation",
          "definition": "Design in which persistence and executability have independent lifecycles and scaling.",
          "whyItMatters": "Allows you to choose performance, isolation and cost per workload without moving data."
        }
      ],
      "workedScenario": {
        "situation": "A company keeps five years of orders in object storage, runs nightly ETL, and serves a hundred dashboards during business hours.",
        "reasoning": [
          "Identify that orders need a common transactional representation, not a different export for each consumer.",
          "Maintain a governed Delta table and assign Jobs compute to the ETL and a SQL warehouse to concurrent consumption.",
          "Scale or stop each compute separately, verifying permissions and SLAs on the same table snapshot."
        ],
        "outcome": "The architecture retains a single governed source, isolates loads and reduces idle cost without sacrificing consistency."
      }
    },
    "keyPoints": [
      "Storage and compute have independent life cycles",
      "Delta maintains data and transactions in open formats",
      "A single governed layer serves ETL, BI, and streaming"
    ],
    "decisions": [
      "Storage and compute have independent life cycles",
      "Delta maintains data and transactions in open formats",
      "A single governed layer serves ETL, BI, and streaming"
    ],
    "example": {
      "title": "Inspect a Delta table",
      "note": "Check format, location, and properties before assuming how a table is stored."
    },
    "pitfalls": [
      "Describe lakehouse as a simple data lake with SQL",
      "Duplicate data per engine without justifying latency or isolation"
    ],
    "examDecision": "If the requirement calls for decoupling compute and persistence, identify object storage as a durable layer and compute as an elastic resource.",
    "checkpoint": {
      "question": "Which component maintains the ACID history of a Delta table?",
      "answer": "The Delta transaction log, stored alongside the data files."
    }
  },
  "m01-l2": {
    "summary": "The control plane manages configuration and metadata; the computing plane processes the data within the perimeter defined for the account.",
    "explanation": [
      "The control plane contains interface services, APIs, configuration and orchestration. The compute plane hosts resources that run Spark or SQL and access storage using the configured identities.",
      "In serverless, Databricks manages the computing plane and its network; In classic compute, the organization controls more elements of the network and instances. This difference affects boot time, operational responsibility, and connectivity controls, not the logical location of the tables in Unity Catalog."
    ],
    "deepDive": {
      "mentalModel": "A Databricks deployment is best understood as two coordinated areas of responsibility. The control plane maintains the product experience: workspace configuration, APIs, Job definitions and resource coordination. The compute plane executes instructions and accesses data with an authorized identity. This division does not mean that all user data travels to the control plane or that the compute plane decides permissions on its own. The useful mental model follows a request: a person or service declares what to execute, the control plane authenticates and orchestrates, and the compute plane materializes the work near the governed sources, subject to network and identity.",
      "mechanics": [
        "When submitting a run, the control services validate the definition and coordinate the creation or selection of the compute. The driver interprets the plan and the executors process partitions, read storage, and write results. Effective credentials should not be embedded in the notebook: they come from identity mechanisms and governed objects. Unity Catalog metadata guides resolution and authorization, but the bytes are read from the location associated with the object when the engine executes the plan.",
        "In classic compute, resources are provisioned within the customer's cloud account and support more network, runtime, and instance decisions. In serverless, Databricks manages infrastructure, scaling and compatible versions within a protected serverless architecture. The choice changes responsibilities and connectivity, not the semantics of a table. That's why a security assessment should follow actual network, identity, and storage paths, rather than inferring exposure from commercial labels."
      ],
      "concepts": [
        {
          "term": "Control plane",
          "definition": "Managed services that offer interface, APIs, configuration and coordination of the platform.",
          "whyItMatters": "Correctly locate authentication and orchestration when analyzing an architecture."
        },
        {
          "term": "Compute plan",
          "definition": "Resources where drivers and executors process data and materialize results.",
          "whyItMatters": "Focus network, capacity, and effective workload identity decisions."
        },
        {
          "term": "Shared responsibility",
          "definition": "Explicit distribution of operational and security tasks between Databricks, the cloud provider and the client.",
          "whyItMatters": "Avoid assuming that serverless eliminates the obligation to govern data, identities and usage."
        }
      ],
      "workedScenario": {
        "situation": "A serverless Job must query a private database and the computer assumes that it will work because the table appears in the catalog.",
        "reasoning": [
          "Separate object discovery, Unity Catalog authorization, and network connectivity to the private database.",
          "Verify that the region and serverless private connectivity support the destination and that the identity has least privileges.",
          "If the constraint cannot be met, document classic compute with controlled networking as an alternative, without changing the data layer."
        ],
        "outcome": "The decision is based on a verifiable path of execution and access, not on mere visibility of the object."
      }
    },
    "keyPoints": [
      "The control plane is not the location of the tables",
      "Serverless reduces infrastructure operation",
      "Connectivity must be designed according to the type of compute"
    ],
    "decisions": [
      "The control plane is not the location of the tables",
      "Serverless reduces infrastructure operation",
      "Connectivity must be designed according to the type of compute"
    ],
    "example": {
      "title": "Separate responsibilities",
      "note": "Use it as a checklist when reviewing an architecture diagram."
    },
    "pitfalls": [
      "Assert that the control plane executes Spark transformations",
      "Assume that classic and serverless share identical network options"
    ],
    "examDecision": "When asked about responsibility, it assigns execution and data access to the compute plane; assigns configuration, UI, and coordination to the control plane.",
    "checkpoint": {
      "question": "What mainly changes when choosing serverless?",
      "answer": "Databricks assumes the provision, scaling and maintenance of the compute, with different network and operation options."
    }
  },
  "m01-l3": {
    "summary": "Delta Lake, Unity Catalog, and runtimes solve different problems and complement each other in a governed architecture.",
    "explanation": [
      "Delta Lake defines the table format and transactional guarantees. Unity Catalog records objects, privileges, lineage, and credentials. Spark, Photon, and SQL warehouses run queries and transformations on those objects.",
      "A query is first resolved against the Unity Catalog namespace, then authorized with the effective identity, and finally executed on a compute resource. Confusing these layers leads to granting permissions in the wrong place or trying to solve a layout problem by adding privileges."
    ],
    "deepDive": {
      "mentalModel": "Delta Lake, Unity Catalog, and runtime engines form complementary layers with different contracts. Delta answers which files make up a valid version and how changes are committed. Unity Catalog answers what the object is called, who owns it, what principal can use it, and where it came from. Spark, Photon, or a SQL warehouse answers how to compute a query with specific resources. No layer replaces the others: registering Parquet in a catalog does not create Delta transactions, converting files to Delta does not grant SELECT, and changing engines does not itself modify ownership. The exam usually presents a symptom; the skill is locating the layer that has the authority to resolve it.",
      "mechanics": [
        "The resolution starts with an identifier catalog.schema.object. Unity Catalog searches for the object, checks for effective privileges, and returns metadata required for access. Catalyst then analyzes expressions and creates a plan; Photon can execute compatible operators in a vectorized manner. Finally, the Delta reader uses the log to determine active files and statistics. This conceptual order explains why a query can fail by name, permission, protocol, or execution, even though the visible message appears on only one interface.",
        "Administrative operations also respect borders. GRANT changes authorization in Unity Catalog, OPTIMIZE reorganizes the file layout of a Delta table, and changing the warehouse size modifies execution resources. Applying the action on the wrong layer produces cost without correcting the cause. A sound operational practice first classifies the issue, retains evidence of the previous state, and then verifies the effect using effective permissions, DESCRIBE DETAIL, history, or query profile as appropriate."
      ],
      "concepts": [
        {
          "term": "Table protocol",
          "definition": "Rules that determine valid commits, read and write functionality, and client compatibility.",
          "whyItMatters": "Distinguishes a Delta table from a simple collection of Parquet files."
        },
        {
          "term": "Securable",
          "definition": "Unity Catalog object on which ownership and privileges can be evaluated.",
          "whyItMatters": "Allows applying least privilege to the correct level of the namespace."
        },
        {
          "term": "Execution Engine",
          "definition": "Implementation that transforms a physical plan into tasks and operations on data.",
          "whyItMatters": "Explains why performance and compatibility depend on compute without altering the logical governance."
        }
      ],
      "workedScenario": {
        "situation": "An analyst can discover main.gold.sales but receives PERMISSION_DENIED; the team proposes to run OPTIMIZE.",
        "reasoning": [
          "Classify the failure as authorization because the object is resolved but the identity cannot read it.",
          "Check USE CATALOG, USE SCHEMA and SELECT are effective, in addition to any applicable bindings.",
          "Grant the group only the necessary privileges and test again from your identity."
        ],
        "outcome": "The query works after correcting Unity Catalog; no files are rewritten or compute is increased unnecessarily."
      }
    },
    "keyPoints": [
      "Delta is table format and protocol",
      "Unity Catalog is governance and discovery",
      "Spark, Photon and SQL warehouses are execution surfaces"
    ],
    "decisions": [
      "Delta is table format and protocol",
      "Unity Catalog is governance and discovery",
      "Spark, Photon and SQL warehouses are execution surfaces"
    ],
    "example": {
      "title": "Resolve a governed object",
      "note": "The name resolves to Unity Catalog; The query is executed on the associated compute."
    },
    "pitfalls": [
      "Treat Unity Catalog as a storage format",
      "Attribute user and group management to Delta"
    ],
    "examDecision": "Choose Delta for ACID and table evolution; Unity Catalog for permissions and lineage; compute to run the workload.",
    "checkpoint": {
      "question": "Where is SELECT granted on a table?",
      "answer": "In Unity Catalog, on the corresponding securable and to an account principal."
    }
  },
  "m01-l4": {
    "summary": "Workspace, metastore, catalog and schema form different areas; Understanding them avoids ambiguous names and misapplied permissions.",
    "explanation": [
      "A workspace is the collaboration and execution surface. A Unity Catalog metastore governs catalogs and maps to workspaces; The three-level namespace catalog.schema.object identifies tables, views, functions, and volumes.",
      "The workspace is not the physical owner of a Unity Catalog table. Multiple workspaces associated with the same metastore can discover an object, although workspace bindings, privileges, and connectivity can limit its use."
    ],
    "deepDive": {
      "mentalModel": "The Unity Catalog namespace is a governance hierarchy, while a workspace is a collaboration and execution surface. A metastore maps to workspaces and contains catalogs; each catalog contains schematics; each schema contains tables, views, volumes, functions, and other objects. The full name catalog.schema.object makes the meaning independent of the accidental context of the session. Metastore mapping enables a common scope, but does not automatically grant access: visibility, privileges, workspace bindings, and connectivity are still different controls. Thinking about nested containers avoids the false idea that copying a notebook or changing workspaces duplicates or transfers ownership of a table.",
      "mechanics": [
        "When you run a three-part name, the catalog first determines which object to search for. Access usually requires use privileges on the ancestors and a specific capability, such as SELECT, on the object or at a level from which it is inherited. The owner can manage the securable, but ownership also does not replace network or credential requirements for external locations. Using fully qualified names reduces collisions and causes Jobs and tests to produce the same result in different sessions.",
        "A workspace associated with the metastore can discover shared catalogs, although workspace bindings can restrict which workspaces use a catalog, external location, or storage credential. This distinction allows production to be isolated without creating another naming system. Workspace artifacts, such as notebooks or Git folders, have their own life cycle; Unity Catalog tables remain in the metastore. Designing promotion means changing configuration and authorized destinations, not manually copying governed data unless explicitly required."
      ],
      "concepts": [
        {
          "term": "Metastore",
          "definition": "Unity Catalog parent scope assignable to one or more workspaces and catalog container.",
          "whyItMatters": "Defines the administrative boundary at which governed objects are resolved."
        },
        {
          "term": "Three-level namespace",
          "definition": "Unambiguous identification of an object through catalog, schema and name.",
          "whyItMatters": "Makes queries and deployments reproducible between sessions and environments."
        },
        {
          "term": "Workspace binding",
          "definition": "Restriction that limits the use of certain securables to selected workspaces.",
          "whyItMatters": "Adds environment isolation without confusing it with user permissions on data."
        }
      ],
      "workedScenario": {
        "situation": "Dev and prod share metastore; a development task should not accidentally write to the production catalog.",
        "reasoning": [
          "Always name the full target and parameterize the catalog by target instead of depending on manual USE CATALOG.",
          "Apply workspace binding to the production catalog and write privileges only to the production principal.",
          "Validate the bundle from dev with development identity and verify that access to prod is denied."
        ],
        "outcome": "The same code is promoted with explicit configuration, while catalog boundaries prevent cross-writes."
      }
    },
    "keyPoints": [
      "The recommended namespace has three levels",
      "The metastore is assigned to one or more workspaces",
      "Visibility and authorization are not equivalent"
    ],
    "decisions": [
      "The recommended namespace has three levels",
      "The metastore is assigned to one or more workspaces",
      "Visibility and authorization are not equivalent"
    ],
    "example": {
      "title": "Explore the namespace",
      "note": "Execute the three statements to locate at which level the discovery fails."
    },
    "pitfalls": [
      "Using one-part names and depending on session context",
      "Confusing workspace ACLs with data privileges"
    ],
    "examDecision": "When multiple tables have the same name, use catalog.schema.table; when a user does not log in, it checks USE CATALOG, USE SCHEMA, and the object's privilege.",
    "checkpoint": {
      "question": "What is the full name of the events table?",
      "answer": "main.learning.events: main catalog, learning schema and events object."
    }
  },
  "m01-l5": {
    "summary": "The right surface depends on latency, language, concurrency, and lifecycle, not a universal preference.",
    "explanation": [
      "Notebooks encourage exploration and interactive development; Lakeflow Jobs execute production tasks with dependencies; SQL warehouses serve concurrent SQL and BI; Spark Declarative Pipelines in Lakeflow manages declarative incremental graphs.",
      "Before selecting a surface, set SLA, execution pattern, identity, state need, and consumers. An exploratory PySpark transformation can start in notebook and end up packaged as a Job task without changing the governed table it produces."
    ],
    "deepDive": {
      "mentalModel": "Choosing a Databricks surface is about matching the lifecycle of work with a service, not deciding which icon is more familiar. A notebook encourages interactive conversation and exploration; Lakeflow Jobs converts tasks into repeatable executions; a SQL warehouse serves concurrent SQL and BI tools; Spark Declarative Pipelines in Lakeflow expresses datasets and dependencies declaratively. Before choosing, set consumer, language, latency, frequency, state, concurrency, identity and recovery. The same calculation can be prototyped in a notebook and deployed as a task, but the production surface must offer input contract, observability and retry. This matrix avoids using permanent interactive clusters as a universal solution.",
      "mechanics": [
        "In development, a session state speeds up iteration, but can also hide dependencies and execution order. When moving to production, a Job creates a run with parameters, tasks, dependencies, identity and observable result. If the product is incremental tables whose dependency can be declared, a pipeline manages the graph and the update state. If the consumer issues short-lived, high-concurrency SQL, the warehouse manages queuing, scaling, and isolation appropriate to the pattern.",
        "The selection must include failures. A dashboard needs auto-stop and the ability to scale concurrency; an ETL needs idempotence, retries and repair; a continuous flow needs checkpoint and restart policy; An exploration needs limits so as not to become production dependency. The governed data can remain the same while the surface changes. This independence allows it to evolve from prototype to operation without intermediate exports, as long as code, parameters and permissions are explicit."
      ],
      "concepts": [
        {
          "term": "Running surface",
          "definition": "Service or environment from which a workload is developed, programmed or served.",
          "whyItMatters": "Connect operational requirements with concrete Databricks capabilities."
        },
        {
          "term": "Life cycle",
          "definition": "Sequence of creation, activity, escalation, recovery and termination of an execution.",
          "whyItMatters": "Determines cost, residual state and necessary operating mechanisms."
        },
        {
          "term": "Declarative load",
          "definition": "Definition of the desired result and its dependencies without manually programming the entire execution order.",
          "whyItMatters": "Allows Lakeflow Pipelines to manage incremental planning and status."
        }
      ],
      "workedScenario": {
        "situation": "A sales calculation is executed manually in a notebook and feeds a management dashboard every morning.",
        "reasoning": [
          "Recognize that the consumer demands schedule, repeatability and alertness, capabilities absent in manual operation.",
          "Extract the testable transformation and deploy it as a pipeline or Job task with governed Gold table.",
          "Serve the result through SQL warehouse and verify SLA, idempotence and repair procedure."
        ],
        "outcome": "The dashboard stops depending on a personal session and maintains complete traceability from the run to the table."
      }
    },
    "keyPoints": [
      "Notebook does not equal production deployment",
      "SQL warehouse prioritizes SQL loads and concurrency",
      "Jobs and pipelines automate different execution cycles"
    ],
    "decisions": [
      "Notebook does not equal production deployment",
      "SQL warehouse prioritizes SQL loads and concurrency",
      "Jobs and pipelines automate different execution cycles"
    ],
    "example": {
      "title": "Minimum decision matrix",
      "note": "Add SLAs and network restrictions before turning the matrix into an architectural decision."
    },
    "pitfalls": [
      "Run production manually from a notebook",
      "Use a permanent interactive cluster for sporadic BI queries"
    ],
    "examDecision": "Associate concurrent BI SQL with SQL warehouse, scheduled tasks with Jobs, and incremental declarative datasets with Lakeflow pipelines.",
    "checkpoint": {
      "question": "What surface would you choose for a SQL dashboard with many users?",
      "answer": "A SQL warehouse, sized and configured for the required concurrency."
    }
  },
  "m02-l1": {
    "summary": "Serverless prioritizes managed operation and fast startup; classic compute offers greater network and configuration control.",
    "explanation": [
      "In serverless, Databricks provisions and optimizes the resource, applies compatible versions and charges based on usage. It is a natural option when you are looking to reduce administration and the workload supports your regional, network and functionality limits.",
      "Classic compute runs with configurable cloud account resources and allows more control over runtime, node types, policies, and initialization. This control increases operational decisions; It does not automatically imply better performance or lower cost."
    ],
    "deepDive": {
      "mentalModel": "Serverless and classic are not quality levels; They are models of responsibility. Serverless delegates the selection, provisioning, scaling and updating of supported compute to Databricks, so the team focuses on the workload. Classic exposes runtime, instance, network, policy, and initialization decisions within the cloud account. The correct comparison begins with restrictions: private connectivity, libraries, task type, required version, region and corporate controls. Startup, elasticity, cost and operational capacity are then assessed. Choosing classic out of habit adds maintenance surface; Choosing serverless while ignoring a limitation may prevent execution. The goal is the minimum control necessary to meet verifiable requirements.",
      "mechanics": [
        "In serverless Jobs, Databricks creates ephemeral resources, enables supported optimizations, and updates the environment based on service policy. The user does not select nodes as in classic and must check task, network and runtime limits. The run identity and Unity Catalog still govern the data. Just because the infrastructure is managed does not make non-idempotent writes secure or eliminate the need for observability, budgets, and controls over who can execute.",
        "In classic compute, a definition specifies runtime, types and number of nodes, access mode, policies, tags, and termination. This allows special requirements to be integrated, but requires managing compatibility, availability and use. An economic comparison should include startup time, idleness, failures and human labor, not just hourly price. The same benchmark with representative data and a common SLA allows us to know if the additional control adds value or just more operational decisions."
      ],
      "concepts": [
        {
          "term": "Serverless compute",
          "definition": "Databricks-managed capacity that is provisioned and scales without setting up underlying infrastructure.",
          "whyItMatters": "Reduces operation when workload and connectivity are supported."
        },
        {
          "term": "Classic compute",
          "definition": "Configurable resources in the client's cloud account with greater runtime, node and network control.",
          "whyItMatters": "It is necessary when a constraint does not fit in the available serverless surface."
        },
        {
          "term": "Compatibility restriction",
          "definition": "Task, library, network, region, or runtime requirement that determines whether a surface can run the job.",
          "whyItMatters": "It should be checked before comparing performance or cost."
        }
      ],
      "workedScenario": {
        "situation": "A JAR with system initialization and access to a private service must be migrated from a classic cluster.",
        "reasoning": [
          "List dependencies on the JAR, init script, runtime version, and network path instead of assuming equivalence.",
          "Contrast each requirement with current serverless tasks and limitations; identify the unsupported ones.",
          "Keep classic Jobs under compute policy if a restriction persists, and prepare a serverless test when it is removed."
        ],
        "outcome": "The architecture uses serverless only where compatible and retains classic control in a justified and limited way."
      }
    },
    "keyPoints": [
      "Serverless eliminates much of the infrastructure management",
      "Classic retains advanced configuration options",
      "Availability and connectivity vary by cloud and region"
    ],
    "decisions": [
      "Serverless eliminates much of the infrastructure management",
      "Classic retains advanced configuration options",
      "Availability and connectivity vary by cloud and region"
    ],
    "example": {
      "title": "Criteria before choosing",
      "note": "The choice is valid only if the region and dependencies are supported."
    },
    "pitfalls": [
      "Choose classic only because it allows more parameters",
      "Assume serverless allows any init script or network path"
    ],
    "examDecision": "When the scenario calls for managed and self-optimized compute with minimal operation, it prioritizes serverless unless an explicit limitation.",
    "checkpoint": {
      "question": "What requirement usually pushes towards classic compute?",
      "answer": "A runtime, library, network, or infrastructure configuration not supported by serverless."
    }
  },
  "m02-l2": {
    "summary": "All-purpose, jobs compute, and SQL warehouses respond to different work cycles and consumers.",
    "explanation": [
      "All-purpose compute supports shared interactive development. Jobs compute is built for automated executions and can isolate dependencies by task or job. A SQL warehouse provides an SQL endpoint for queries, dashboards, and BI tools.",
      "For repeatable production, compute jobs or serverless jobs avoid relying on the state of an interactive session. For BI, the SQL warehouse provides scaling and concurrency controls that should not be simulated with a permanently connected notebook."
    ],
    "deepDive": {
      "mentalModel": "All-purpose compute, jobs compute, and SQL warehouses are distinguished by who uses them and how much state they must retain. All-purpose accompanies an interactive human session and supports iteration; jobs compute accompanies an automated run and promotes a reproducible environment; A SQL warehouse is a SQL endpoint optimized for concurrent queries, dashboards, and BI tools. They are not three sizes of the same cluster. Assigning production to an interactive resource introduces residual state, personal permissions, and downtime costs. Serving BI from a development cluster mixes incompatible queues and scaling cycles. The right model ties each resource to an operational intent and makes the data persist outside of it.",
      "mechanics": [
        "An all-purpose cluster can remain active between commands, so variables, caches or libraries installed during the session influence subsequent results. It's useful for exploring, but an automation must declare its dependencies. Jobs creates an identifiable execution; serverless or classic jobs compute is prepared for supported tasks and the relevant state is persisted in tables, checkpoints or artifacts. The run can be retried, repaired, and audited without depending on the user who opened a notebook.",
        "A SQL warehouse receives statements using Databricks SQL, JDBC/ODBC connectors, and BI tools. Its auto-stop, scaling, and concurrency mechanisms respond to bursts of queries, not a long-running PySpark DAG. Selecting the correct surface improves isolation and attribution. Still, a warehouse doesn't fix a broken Gold model or a filter that scans the entire table; Compute and data design must be measured together."
      ],
      "concepts": [
        {
          "term": "All-purpose compute",
          "definition": "Classic computing aimed at interactive user work on notebooks and exploration.",
          "whyItMatters": "Explain why it is not the recommended option for repeatable production jobs."
        },
        {
          "term": "Jobs compute",
          "definition": "Compute associated with automated executions and defined for the tasks of a workflow.",
          "whyItMatters": "Reduces residual state and links cost, logs and dependencies to the run."
        },
        {
          "term": "SQL warehouse",
          "definition": "Specialized compute resource that exposes a SQL endpoint for analytics and BI.",
          "whyItMatters": "It provides isolation, concurrency and auto-stop cycle according to SQL consumption."
        }
      ],
      "workedScenario": {
        "situation": "Fifty analysts consult sales at 9:00 while the team modifies development notebooks in the same cluster.",
        "reasoning": [
          "Separate the concurrent and short pattern of BI from the interactive and changing pattern of development.",
          "Publish a Gold table and connect it to a SQL warehouse with appropriate scaling, maintaining all-purpose for exploring.",
          "Move any scheduled updates to Jobs compute and measure queue, latency and cost per surface."
        ],
        "outcome": "BI users gain stable latency and development stops competing for resources or introducing accidental state."
      }
    },
    "keyPoints": [
      "All-purpose is interactive",
      "Jobs compute accompanies automated executions",
      "SQL warehouse serves SQL and BI"
    ],
    "decisions": [
      "All-purpose is interactive",
      "Jobs compute accompanies automated executions",
      "SQL warehouse serves SQL and BI"
    ],
    "example": {
      "title": "Load selection",
      "note": "Add serverless and isolation requirements into a real decision."
    },
    "pitfalls": [
      "Program a production notebook on a personal cluster",
      "Connect a BI tool to the development compute"
    ],
    "examDecision": "Associate the interactive cycle with all-purpose, automation with compute jobs, and SQL consumers with warehouses.",
    "checkpoint": {
      "question": "Why prefer jobs compute for scheduled ETL?",
      "answer": "Because it offers a reproducible environment linked to execution and avoids the residual state of an interactive cluster."
    }
  },
  "m02-l3": {
    "summary": "Autoscaling, auto-termination, and pools solve different problems: capacity, downtime, and provisioning latency.",
    "explanation": [
      "Autoscaling modifies the number of workers within limits; it does not correct a skewed plan nor guarantee that a single-threaded task will speed up. Auto-termination terminates idle compute and reduces cost, but must be balanced with the interactive experience.",
      "Pools keep instances ready for classic compute and reduce boot time without maintaining entire clusters. Serverless manages its own provisioning, so it is not combined with user-created pools."
    ],
    "deepDive": {
      "mentalModel": "Autoscaling, auto-termination and pools act at different times of the compute cycle. Autoscaling modifies workers within limits for parallelizable demand; It does not split a single biased task or accelerate code executed only in the driver. Auto-termination turns off an interactive resource after inactivity and controls idleness. A pool maintains classic instances prepared for downprovisioning, but does not maintain a full cluster nor does it apply to managed serverless compute. The useful question is not which one to always activate, but rather what latency or waste is observed. First, identify whether the problem occurs during execution, during inactivity, or during startup; Then the mechanism is selected and its effect is measured.",
      "mechanics": [
        "The autoscaler observes demand and adjusts workers between minimum and maximum. Spark only leverages new workers when there are enough runnable tasks; a huge partition is still limited to one task. A high minimum improves response but maintains cost, while an insufficient maximum limits peaks. Serverless manages its own elasticity; In classic, limits must respect quotas, policies, and workload characteristics. The evaluation is done with task distribution, duration and utilization, not only with CPU average.",
        "Auto-termination counts periods of inactivity depending on the type of compute and avoids entire days of forgotten resources. Pools attack another wait: they keep idle machines ready for new classic clusters to start sooner, at their own cost. Sharing a pool between compatible jobs can amortize capacity, but versions, instance types, and isolation must match. In production, guardrails are combined: scaling limits, reasonable termination, tags and alerts on utilization."
      ],
      "concepts": [
        {
          "term": "Horizontal elasticity",
          "definition": "Increase or reduction in the number of workers available for parallel tasks.",
          "whyItMatters": "Clarifies when autoscaling can reduce duration and when it cannot."
        },
        {
          "term": "Inactivity",
          "definition": "Period in which a resource remains active without recognized work that justifies its cost.",
          "whyItMatters": "It is the signal that auto-termination aims to limit."
        },
        {
          "term": "Instance pool",
          "definition": "Set of pre-provisioned cloud instances to accelerate the creation of classic compute.",
          "whyItMatters": "Reduces boot latency without confusing it with capacity during a run."
        }
      ],
      "workedScenario": {
        "situation": "Short classic jobs take six minutes to start and two to process; Increasing workers does not reduce the wait.",
        "reasoning": [
          "Separate Spark provisioning time and real time metrics, confirming that the neck is before the run.",
          "Evaluate a compatible or serverless pool, instead of raising the maximum autoscaling that only acts during execution.",
          "Compare latency and total cost per run, including the idle capacity maintained by the pool."
        ],
        "outcome": "The mechanism that reduces start-up with measured cost is chosen; the parallelism remains dimensioned to the real work."
      }
    },
    "keyPoints": [
      "Autoscaling responds to parallelizable demand",
      "Auto-termination controls inactivity",
      "Pools reduce classic compute startup"
    ],
    "decisions": [
      "Autoscaling responds to parallelizable demand",
      "Auto-termination controls inactivity",
      "Pools reduce classic compute startup"
    ],
    "example": {
      "title": "Guardrails of an interactive cluster",
      "note": "A compute policy must limit the values allowed in production."
    },
    "pitfalls": [
      "Use autoscaling as an automatic solution to skew",
      "Configure auto-termination above the work day"
    ],
    "examDecision": "If the problem is starting recurring classic clusters, think about pools; if inactivity, auto-termination; if it is variable demand, autoscaling.",
    "checkpoint": {
      "question": "Does a pool keep a cluster running?",
      "answer": "No; keeps instances ready to reduce provisioning of classic clusters."
    }
  },
  "m02-l4": {
    "summary": "The access mode determines isolation and compatibility with Unity Catalog; It should not be chosen because of the team name.",
    "explanation": [
      "Standard access mode allows multiple users with isolation and is the recommended option for many loads. Dedicated assigns the resource to a user or group and covers requirements that require dedicated access or features not supported in Standard.",
      "Compute policies should set consistent versions, node types, tags, and limits. Least privilege also includes preventing each user from creating resources without financial or security guardrails."
    ],
    "deepDive": {
      "mentalModel": "The access mode defines how execution is isolated and what governance functionalities the compute supports; does not grant permissions on tables. Standard is the recommended multi-user mode for many governed loads and enforces isolation between users. Dedicated assigns the resource to a single user or group and is reserved for isolation or compatibility needs not covered by Standard. Unity Catalog separately evaluates who can use each securable. A compute policy transforms this decision into guardrails: sets or limits mode, runtime, nodes, termination and tags. The principle of least privilege covers both data and the ability to create costly or insecure infrastructure.",
      "mechanics": [
        "In Standard, the system associates each operation with the effective identity and restricts APIs or patterns that would break the isolation. Compatibility has evolved with runtimes, so check for specific version and functionality. Dedicated provides an assigned context and can support additional requirements, but increases cost and management footprint if adopted unnecessarily. In serverless Jobs, the service uses the supported isolation model and hides much of the cluster configuration.",
        "Compute policies evaluate configurations when creating resources. A fixed field imposes a value; ranges and lists allow controlled options; Default values ​​guide without overriding validation. In addition to security, policies can require cost tags, auto-termination, and approved instance families. They do not replace GRANT, workspace bindings or credentials. A complete design combines compute policy, runtime identity, and Unity Catalog privileges with clearly separated responsibilities."
      ],
      "concepts": [
        {
          "term": "Standard access mode",
          "definition": "Multi-user mode with isolation and governed compatibility for supported workloads.",
          "whyItMatters": "This is the recommended starting point when multiple identities share compute."
        },
        {
          "term": "Dedicated access mode",
          "definition": "Compute mode assigned to a specific identity or group.",
          "whyItMatters": "Covers explicit requirements that do not work or should not be shared in Standard."
        },
        {
          "term": "Compute policy",
          "definition": "Managed set of rules that limits and defaults classic compute configurations.",
          "whyItMatters": "Turn cost and safety decisions into actionable controls, not recommendations."
        }
      ],
      "workedScenario": {
        "situation": "One hundred users can create clusters without hitchhiking and several choose Dedicated to read the same internal public tables.",
        "reasoning": [
          "Confirm that the functions used are compatible with Standard and that Unity Catalog already manages data access.",
          "Create a policy with Standard, auto-termination, approved types and mandatory tags, reserving a documented exception.",
          "Measure utilization and periodically review who needs the Dedicated exception and why."
        ],
        "outcome": "Normal use is isolated and governed at a lower cost, while exceptions are few, justified and auditable."
      }
    },
    "keyPoints": [
      "Standard combines sharing and isolation",
      "Dedicated is reserved for explicit requirements",
      "Compute policies turn decisions into guardrails"
    ],
    "decisions": [
      "Standard combines sharing and isolation",
      "Dedicated is reserved for explicit requirements",
      "Compute policies turn decisions into guardrails"
    ],
    "example": {
      "title": "Restriction with compute policy",
      "note": "USER_ISOLATION corresponds to Standard mode in the classic compute API."
    },
    "pitfalls": [
      "Use Dedicated for everyone without reviewing need",
      "Confusing access mode with table privileges"
    ],
    "examDecision": "Choose Standard by default for governed multi-user workloads; use Dedicated if a limitation or isolation requirement requires it.",
    "checkpoint": {
      "question": "Who grants access to a table: access mode or Unity Catalog?",
      "answer": "Unity Catalog; The access mode defines how the compute is isolated and executed."
    }
  },
  "m02-l5": {
    "summary": "The total cost combines DBUs, cloud infrastructure, startup time, utilization and operational work.",
    "explanation": [
      "A useful comparison measures consumption per unit of result: cost per execution, per GB processed or per query within the SLA. Reducing the hourly price can increase the cost if it lengthens runtime or causes failures and retries.",
      "The system.billing.usage table records attributable consumption and labels; to obtain monetary cost it can be combined with system.billing.list_prices. Tags and serverless budget policies allow assignment by team or product."
    ],
    "deepDive": {
      "mentalModel": "The cost of Databricks is a consequence of the work completed, not just the hourly price. DBUs, cloud infrastructure when applicable, startup time, duration, utilization, retries, storage and operational effort are involved. The comparison unit must keep the result and the SLA constant: cost per correct pipeline, per terabyte transformed or per query served within the objective. A cheap cluster that takes three times as long or fails twice may cost more. Billing system tables record usage and attributable metadata; prices and tags allow it to be converted into product responsibility. Useful FinOps unites technical telemetry with a concrete design decision.",
      "mechanics": [
        "system.billing.usage contains consumption records with quantities, SKUs, times and available tags. The sum must consider corrections or restatements according to the current scheme, and can be joined with list_prices to estimate currency. Consistent tags or serverless budget policies allow grouping by team, application and environment. Attribution fails if only the cluster is tagged but other products are ignored, or if each computer uses free values ​​that are not normalized.",
        "Optimizing starts with a baseline: same input, validated output and SLA. Then a variable is changed, such as surface, size, layout or frequency, and duration, use, failures and cost are compared. Reducing compute can worsen spills; adding compute may not affect a single skewed partition. Defensible savings are expressed per unit of value and are monitored long enough to include spikes, surges, and autoscaling behavior."
      ],
      "concepts": [
        {
          "term": "DBU",
          "definition": "Databricks capacity consumption unit whose rate depends on the product and SKU used.",
          "whyItMatters": "It allows measuring service, but must be combined with cloud costs and workload results."
        },
        {
          "term": "Cost per result",
          "definition": "Relationship between total cost and a correct output that meets a defined SLA.",
          "whyItMatters": "Avoid apparent optimizations based only on rate or size."
        },
        {
          "term": "Attribution",
          "definition": "Consistent allocation of consumption to owner, product, environment or cost center.",
          "whyItMatters": "It makes it possible to hold accountable, budget, and prioritize optimizations."
        }
      ],
      "workedScenario": {
        "situation": "An ETL goes from eight to four workers: the hourly cost drops, but it doubles the duration and loses the SLA by three days.",
        "reasoning": [
          "Calculate total cost per successful execution, including retries and operational penalty, not just hourly rate.",
          "Compare task and spill metrics to determine if the smaller size caused the stretch.",
          "Try an intermediate configuration or correct the plan, and keep the option that meets the SLA at the lowest total cost."
        ],
        "outcome": "The decision is based on delivered value and telemetry; False savings that fail to comply with the service are discarded."
      }
    },
    "keyPoints": [
      "DBU is not the entire cloud cost",
      "Optimize cost per result, not isolated size",
      "Tags and system tables allow attribution"
    ],
    "decisions": [
      "DBU is not the entire cloud cost",
      "Optimize cost per result, not isolated size",
      "Tags and system tables allow attribution"
    ],
    "example": {
      "title": "Consumption by equipment",
      "note": "Filters retractions and restatements through addition; add prices if you need currency."
    },
    "pitfalls": [
      "Compare only DBUs without infrastructure cost",
      "Reduce workers without remeasuring duration and SLA"
    ],
    "examDecision": "If the statement asks for attribution, use tags and system.billing.usage; If you ask for optimization, compare cost and performance before and after.",
    "checkpoint": {
      "question": "What metric allows configurations to be compared fairly?",
      "answer": "The cost per execution or unit of work meeting the same SLA."
    }
  },
  "m03-l1": {
    "summary": "A notebook is useful for interactive development when its dependencies, parameters, and execution order are explicit.",
    "explanation": [
      "Cells support SQL, Python, and visualizations, but process status allows for out-of-order execution. For someone else to reproduce the result, running from scratch must create the same variables, temporary tables, and outputs.",
      "Python workspace files and modules make it easy to separate reusable logic from exploratory storytelling. An input notebook should coordinate testable functions, not concentrate transformations and side effects in dozens of cells."
    ],
    "deepDive": {
      "mentalModel": "A notebook is simultaneously a document, execution client and interactive state. That combination speeds up learning, but hinders reproducibility when cells are executed out of order or depend on variables, temporary tables, and manually installed libraries. The self-contained model separates narrative from logic: the notebook receives parameters, invokes importable functions, displays small evidence, and ends up with governed outputs. It must be able to run from a clean state from start to finish. Workspace files and Python packages store testable logic; Jobs provides the production contract. The key question is not whether a cell worked once, but what dependencies exactly explain its result.",
      "mechanics": [
        "The Python process connected to compute preserves variables, imports, and cache between commands. SQL cells can create temporary views bound to the session. If a subsequent cell uses that state and someone else runs the notebook from scratch, the result changes or fails. Restart Python and Run all are useful tests, but they are not a substitute for hardened dependencies, explicit parameters, and idempotent writes. Side effects must be localized and verified using tables or metrics.",
        "A maintainable framework places pure transformations in modules under version control and leaves the notebook as the entry point. Functions receive DataFrames or values, return results and can be tested with small fixtures. In production, a Job task installs the pinned artifact and passes parameters. This reduces coupling to personal paths, facilitates review, and allows the pedagogical explanation to remain clear without becoming the only business implementation."
      ],
      "concepts": [
        {
          "term": "Session state",
          "definition": "Variables, imports, temporary views and caches that survive between commands in an active session.",
          "whyItMatters": "It is the main cause of notebooks that work only for their author."
        },
        {
          "term": "Side effect",
          "definition": "Observable change outside of the returned value, such as writing a table or modifying settings.",
          "whyItMatters": "It should be isolated so that retries and tests are predictable."
        },
        {
          "term": "Reproducibility",
          "definition": "Ability to obtain the same output from declared inputs, code, parameters and dependencies.",
          "whyItMatters": "It is the criterion that allows a notebook to be promoted to reliable operation."
        }
      ],
      "workedScenario": {
        "situation": "A daily notebook works if its author executes cell 17 first, but fails as a new Job task.",
        "reasoning": [
          "Restart the session and run from top to bottom to locate variables or views created outside of narrative order.",
          "Move the transformation to an importable function and declare parameters, libraries and input tables.",
          "Run twice as Job with clean environment and compare output, metrics and idempotency."
        ],
        "outcome": "The process stops depending on personal memory and becomes a reproducible and auditable entry point."
      }
    },
    "keyPoints": [
      "Running from scratch reveals hidden state",
      "Reusable logic belongs to modules",
      "The output must depend on explicit parameters"
    ],
    "decisions": [
      "Running from scratch reveals hidden state",
      "Reusable logic belongs to modules",
      "The output must depend on explicit parameters"
    ],
    "example": {
      "title": "Notebook as an entry point",
      "note": "clean_orders can be tested outside of the notebook with small DataFrames."
    },
    "pitfalls": [
      "Rely on a cell executed hours before",
      "Install libraries manually without fixing version"
    ],
    "examDecision": "If a notebook works only after executing cells in a certain order, remove hidden state and extract logic before productivity.",
    "checkpoint": {
      "question": "What rapid test detects hidden status?",
      "answer": "Restart the process and run all the cells in order from the beginning."
    }
  },
  "m03-l2": {
    "summary": "SQL expresses relational transformations clearly; PySpark makes it easy to compose, control, and test Python projects.",
    "explanation": [
      "SQL is concise for selection, aggregation, joins and DDL/DML. PySpark uses the same optimizer for DataFrame operations and allows you to build functions, iterate over metadata or integrate Python libraries.",
      "The choice should not be based on an assumed universal difference in performance: many expressions converge on equivalent plans. It is advisable to prioritize maintainability, team knowledge and the need for abstraction, using native functions before Python UDFs."
    ],
    "deepDive": {
      "mentalModel": "SQL and PySpark express plans on the same engine, but offer different cognitive tools. SQL describes relationships and results using declarative algebra; It is usually the most readable form for filters, joins, aggregations and models that review diverse profiles. PySpark composes the DataFrame API from Python and facilitates abstractions, control, reuse, and testing. There is no prize for translating each query from one form to another. The transformation is first represented with native functions that Catalyst can parse; Then the language is chosen that makes the intention visible and reduces accidental complexity. A Python UDF is an optimization frontier and must be justified, not a common shortcut.",
      "mechanics": [
        "Both an SQL statement and a DataFrame string build a logical plan with columns, filters, and relationships. Catalyst resolves names and types, applies rules, and selects a physical plan. Therefore filter in PySpark and WHERE in SQL can produce equivalent operations. Built-in functions keep expressions visible to the optimizer. Encapsulating the same logic in a Python UDF can add serialization and hide semantics, although certain vectorized UDFs mitigate some of the cost.",
        "PySpark provides Python's ecosystem of modules, functions, types, and tests, useful when the transformation is configuration-dependent or combined in an application. SQL facilitates direct review, permissions on views and declarative models. In a mixed project, define common input and output contracts and avoid language jumps that only fragment the flow. Equivalence is validated by schema, rows and plan, not by textual similarity between implementations."
      ],
      "concepts": [
        {
          "term": "logical plan",
          "definition": "Declarative representation of operations on relations before choosing physical algorithms.",
          "whyItMatters": "It allows us to understand that SQL and DataFrames can converge in the same execution."
        },
        {
          "term": "Native function",
          "definition": "Expression known to Spark and visible for analysis, optimization, and code generation.",
          "whyItMatters": "Typically retains better performance and diagnostics than an opaque UDF."
        },
        {
          "term": "UDF Python",
          "definition": "User-defined function executed at the boundary between JVM and Python process.",
          "whyItMatters": "It may be necessary, but it introduces costs and limits optimizations if it replaces built-in functions."
        }
      ],
      "workedScenario": {
        "situation": "A transformation normalizes emails, aggregates sales, and applies a complex Python classification library.",
        "reasoning": [
          "Express normalization and aggregation with native SQL/DataFrame functions for Catalyst to optimize.",
          "Isolate only sorting with no native equivalent in a testable function, evaluating a vectorized UDF if appropriate.",
          "Compare schema, results and profile with a representative set before adopting the implementation."
        ],
        "outcome": "The solution keeps most of the plan visible and reserves specialized Python for the requirement that really needs it."
      }
    },
    "keyPoints": [
      "SQL and DataFrame API share optimizer",
      "PySpark facilitates Python modularity",
      "Native functions often outperform Python UDFs"
    ],
    "decisions": [
      "SQL and DataFrame API share optimizer",
      "PySpark facilitates Python modularity",
      "Native functions often outperform Python UDFs"
    ],
    "example": {
      "title": "Native transformation equivalent to SQL",
      "note": "Compare daily.explain('formatted') with the equivalent SQL query."
    },
    "pitfalls": [
      "Convert to pandas for a distributed transformation",
      "Create a UDF for a function already available in Spark SQL"
    ],
    "examDecision": "When a native SQL/PySpark function exists, use it before a UDF to maintain optimization and efficient execution.",
    "checkpoint": {
      "question": "Is SQL always faster than PySpark DataFrames?",
      "answer": "No; Equivalent expressions usually generate the same optimized plan."
    }
  },
  "m03-l3": {
    "summary": "Job parameters and widgets turn a run into a reproducible contract, not a collection of hand-edited values.",
    "explanation": [
      "A widget receives text values in a notebook and can be fed by task parameters. It is advisable to validate format, range and allowed values ​​at the beginning to fail before modifying data.",
      "Parameters must represent run variation, such as target date or catalog; Secrets and credentials should not travel as text. Task values ​​are used to share small values ​​between tasks, while datasets are published to governed storage."
    ],
    "deepDive": {
      "mentalModel": "A parameter is part of the contract of an execution: it has a name, origin, expected type, allowed value, and effect. A widget is just an interface for receiving values ​​in a notebook; it should not become configuration storage or secret. Job parameters are resolved for a run and can be passed to compatible tasks. The transformation converts received strings to domain types and fails early if they are invalid. Separating data parameters avoids passing large payloads through the orchestration: a date, path, or identifier reference persisted entries; the table or Volume contains the dataset. Thus an execution can be reconstructed by reading run, code and recorded values.",
      "mechanics": [
        "Lakeflow Jobs defines parameters at the job and task level, and supports dynamic references to context and small outputs. In a notebook, dbutils.widgets.get returns text, so the code must parse dates, enumerations, and limits before querying. Default values ​​make development easier, but production must record which ones were applied. A sensitive parameter is not written to YAML or widgets: it is resolved by secrets, connections, or governed identities as the case may be.",
        "Correct parameterization modifies selection or destination without duplicating logic. process_date can determine a partition; catalog may vary by target; mode can be limited to a safe set. If a value changes SQL structure, you should avoid unsafe concatenation and use supported parameter APIs. The contract is tested with valid value, edge and error. A reproducible run preserves the code version and effective parameters along with output metrics."
      ],
      "concepts": [
        {
          "term": "Job Parameter",
          "definition": "Declared and recorded value that configures a specific execution or task.",
          "whyItMatters": "It allows you to reuse code and reconstruct why a run processed a given input."
        },
        {
          "term": "Widget",
          "definition": "Notebook control that exposes a textual value to the interactive or parameterized session.",
          "whyItMatters": "It is an input interface, not a type system or secret store."
        },
        {
          "term": "Dynamic reference",
          "definition": "Expression that resolves run metadata or values produced by tasks at runtime.",
          "whyItMatters": "Connect tasks without manual values and maintain context traceability."
        }
      ],
      "workedScenario": {
        "situation": "A backfill requires reprocessing 2026-06-30 and someone proposes editing a literal date on ten notebooks.",
        "reasoning": [
          "Define process_date once in the Job and propagate it as a parameter to tasks that select partitions.",
          "Validate format and range at start; keep intermediate data in tables, not as task values.",
          "Launch a parameterized run and keep metrics from that date to compare with production."
        ],
        "outcome": "The backfill uses the same deployed code, remains auditable and does not introduce divergences due to manual edits."
      }
    },
    "keyPoints": [
      "Widgets receive strings",
      "Validate parameters before writing",
      "Do not use task values to transport datasets"
    ],
    "decisions": [
      "Widgets receive strings",
      "Validate parameters before writing",
      "Do not use task values to transport datasets"
    ],
    "example": {
      "title": "Validated date parameter",
      "note": "The Job can pass process_date without editing the notebook."
    },
    "pitfalls": [
      "Read a widget without validating its type",
      "Include passwords directly in Job parameters"
    ],
    "examDecision": "Use parameters to vary execution and secret scopes or governed credentials for authentication.",
    "checkpoint": {
      "question": "What type does dbutils.widgets.get return?",
      "answer": "A chain; the code must convert and validate it."
    }
  },
  "m03-l4": {
    "summary": "Databricks Connect allows you to run and debug Spark code from a local IDE against Databricks compute.",
    "explanation": [
      "Databricks Connect implements Spark Connect: the local process builds plans that are executed remotely. This allows you to use the debugger, tests and IDE integration without downloading the entire dataset to the laptop.",
      "The client version must be compatible with the selected runtime or serverless and authentication must be configured using a profile, OAuth, or other supported mechanism. Code that depends on APIs exclusive to the driver or the local filesystem may need adaptation."
    ],
    "deepDive": {
      "mentalModel": "Databricks Connect separates the local editing experience from where Spark runs. The IDE maintains code, debugger, and tests; A remote session sends plans to Databricks compute and uses data governed there. It is not a local Spark that automatically copies tables to the notebook. Compatibility depends on Databricks Connect version, runtime and supported capabilities; authentication identifies the developer or principal. The mental model avoids two mistakes: assuming that large processing occurs locally or believing that purging authorizes additional data. Productivity improves when pure logic is tested locally and Spark integrations are verified against a bounded remote environment.",
      "mechanics": [
        "The client creates a SparkSession configured for Databricks Connect. DataFrame calls are serialized using the supported protocol and the remote backend parses and executes the plan. Only requested results cross to the client, so collect is still dangerous for large volumes. Unity Catalog evaluates the configured identity and the compute must support the connection mode. The logs can be distributed between client and remote execution, so the diagnosis begins by locating where the error occurred.",
        "The reproducible configuration fixes project dependencies and a compatible version of the client. Profiles or authentication variables are not committed; Official mechanisms and short-lived credentials are used. A unit test can run functions offline when they don't need Spark, while an integration test creates governed temporary data and cleans up its own namespace. Thus, local development does not avoid policies or turn production into a test bed."
      ],
      "concepts": [
        {
          "term": "Spark Connect",
          "definition": "Client-server architecture used to build plans on a client and run them on a remote Spark backend.",
          "whyItMatters": "Explains the separation between local IDE and Databricks processing."
        },
        {
          "term": "Version Compatibility",
          "definition": "Supported correspondence between Databricks Connect client and runtime or remote compute.",
          "whyItMatters": "Avoid protocol errors and non-existent functions during development."
        },
        {
          "term": "Integration test",
          "definition": "Testing that exercises real dependencies such as remote Spark, catalog, and storage in a controlled environment.",
          "whyItMatters": "Detects problems that a purely local test cannot represent."
        }
      ],
      "workedScenario": {
        "situation": "A developer wants to debug a billion row transformation from VS Code and run collect to inspect it.",
        "reasoning": [
          "Confirm that the plan will be executed remotely and that collect would move the result to the client, creating a memory and data risk.",
          "Test pure functions with local fixtures and run a remote integration on a representative governed sample.",
          "Inspect limited aggregates and the plan, maintaining compatible versions and authentication."
        ],
        "outcome": "The convenience of the IDE is preserved without extracting the dataset or confusing local debugging with remote execution capability."
      }
    },
    "keyPoints": [
      "Spark processing happens on Databricks",
      "Client and runtime must be compatible",
      "Authentication is not embedded in the code"
    ],
    "decisions": [
      "Spark processing happens on Databricks",
      "Client and runtime must be compatible",
      "Authentication is not embedded in the code"
    ],
    "example": {
      "title": "Session with Databricks Connect",
      "note": "The dev profile is configured outside of the repository; Serverless requires support in the workspace."
    },
    "pitfalls": [
      "Believe that Spark processes data on the laptop",
      "Save a personal access token to the repository"
    ],
    "examDecision": "If local development with remote execution and debugging in IDE is requested, Databricks Connect is the specific tool.",
    "checkpoint": {
      "question": "Where is spark.range(10).count() executed with Connect?",
      "answer": "On Databricks remote compute; the local client sends the plan and receives the result."
    }
  },
  "m03-l5": {
    "summary": "Git folders, pinned dependencies, and packages separate collaboration, environment, and business logic.",
    "explanation": [
      "A Git folder synchronizes workspace files with a Git provider and allows branches, commits, and revision. It does not replace a CI process or automatically convert a notebook into a deployable artifact.",
      "A maintainable project declares dependencies in pyproject.toml, limits version ranges, and builds a wheel when appropriate. Dev, test and prod must run the same artifact, changing configuration through variables and not through copies of the code."
    ],
    "deepDive": {
      "mentalModel": "A production project needs to separate three versions: code, dependencies and declared infrastructure. Git folders sync workspace files with a repository and allow branches; a lock or specification fixes libraries; a Python package offers an installable and importable unit; a bundle describes jobs, pipelines and targets. Copying a notebook for dev, test and prod breaks that identity because each copy is derived. The correct model promotes the same commit and artifact, while configuration, catalog and identity change by target. Secrets are never part of the repository. This structure makes it possible to review differences, reproduce a run, and roll back a version without manually rebuilding the workspace state.",
      "mechanics": [
        "Git records content and relationships between commits. A branch isolates work; A pull request allows review before integrating. Git folders brings that code to the workspace, but does not replace provider protections or store tables. Modern notebooks can be versioned as files, although output and interactive state should not be considered production artifacts. Schema and resource changes need their own reviewable definition to accompany the code.",
        "The package groups modules under a namespace and declares versions of dependencies. CI builds the artifact once, runs tests and preserves its identity. The deployment uses Declarative Automation Bundles or APIs to apply resources per target. A service principal runs production with least privileges. If a library is manually installed on a cluster or a token appears in configuration, it can no longer be proven that two runs used the same environment."
      ],
      "concepts": [
        {
          "term": "Artifact",
          "definition": "Versioned, immutable output of a build process, such as a Python wheel.",
          "whyItMatters": "It allows you to deploy exactly what has been tested instead of rebuilding by environment."
        },
        {
          "term": "Git folder",
          "definition": "Workspace folder connected to a Git repository for editing and syncing code.",
          "whyItMatters": "Facilitates collaboration without turning the workspace into a single source of truth."
        },
        {
          "term": "Lock dependencies",
          "definition": "Recording of concrete versions resolved for direct and transitive libraries.",
          "whyItMatters": "Reduces environment differences and makes tests and executions repeatable."
        }
      ],
      "workedScenario": {
        "situation": "A hotfix works on dev because someone manually installed a newer library, but fails to deploy to prod.",
        "reasoning": [
          "Compare declared dependencies and effective environment to identify unversioned installation.",
          "Fix the version, rebuild a single artifact, and run automated tests with that lock.",
          "Promote the same artifact using targets and eliminate manual changes from the compute."
        ],
        "outcome": "Dev and prod run an identical unit and the configuration difference is explicit, reviewable and reversible."
      }
    },
    "keyPoints": [
      "Git logs code, not data or secrets",
      "pyproject.toml declares dependencies",
      "The same artifact must be promoted between environments"
    ],
    "decisions": [
      "Git logs code, not data or secrets",
      "pyproject.toml declares dependencies",
      "The same artifact must be promoted between environments"
    ],
    "example": {
      "title": "Project dependencies",
      "note": "The module 11 bundle will automate the promotion of the artifact."
    },
    "pitfalls": [
      "Compromise sensitive credentials or data",
      "Maintain a different version of the notebook per environment"
    ],
    "examDecision": "For collaboration use Git folders; For repeatable promotion, package code and apply configuration per target.",
    "checkpoint": {
      "question": "What should change between dev and prod?",
      "answer": "The configuration and identities of the target, not a divergent copy of the logic."
    }
  },
  "m04-l1": {
    "summary": "Transformations build a logical plan; The actions execute it and materialize a result.",
    "explanation": [
      "DataFrames are immutable: select, filter or withColumn return a new plan without reading all the data immediately. Catalyst can reorganize and simplify that plan before executing it.",
      "count, collect, write and display are actions. Repeating actions on the same lineage can recalculate it; cache only compensates if there is measured reuse and sufficient memory."
    ],
    "deepDive": {
      "mentalModel": "The DataFrame API is lazy: a transformation describes a new relationship and an action requires a result. Spark does not process row by row when writing select, filter, or join; accumulates a logical plan that Catalyst can reorganize. count, collect, write or a display triggers a job that materializes part of the lineage. This separation allows pushdown, pruning of columns and choosing joins, but it is also surprising when a repeated action recalculates everything. Cache only makes sense if the same expensive result is reused and fits safely. To reason about performance, identify where the plan is defined, where an action is born, and what shuffle boundaries divide stages.",
      "mechanics": [
        "Each DataFrame contains schema and plan node, not a local collection of rows. Invoking a transformation returns another DataFrame with an extended plan. When an action arrives, Spark analyzes, optimizes, and generates a physical plan; The driver creates jobs and stages, and the executors process partitions. Two actions on the same lineage can be executed twice if there is no effective reuse or caching. explain allows you to inspect before materializing.",
        "Persisting a DataFrame introduces a reusable materialization after the first action and consumes memory or disk depending on the level. It must be released when it stops serving. Writing a table creates a durable effect and its mode defines repetition semantics. collect moves all rows to the driver and breaks the distribution; take, limit or reduced aggregates are alternatives for inspection. Laziness does not prevent errors: some appear only when executing because the plan has not yet touched data."
      ],
      "concepts": [
        {
          "term": "Transformation",
          "definition": "Lazy operation that produces a new DataFrame and extends the logical plan.",
          "whyItMatters": "Allows you to compose work before Spark chooses how to run it."
        },
        {
          "term": "Action",
          "definition": "Operation that requests a result and triggers the execution of the necessary plan.",
          "whyItMatters": "Marks the point where costs, jobs and errors linked to data appear."
        },
        {
          "term": "Lineage",
          "definition": "Transformation dependency chain required to recompute a DataFrame.",
          "whyItMatters": "Explains recomputation, recovery, and when a cache can add value."
        }
      ],
      "workedScenario": {
        "situation": "A notebook calls count, display and write on the same expensive transformation and takes three times as long as expected.",
        "reasoning": [
          "Recognize three independent actions and check in Spark UI that the lineage is recalculated.",
          "Determine if the result is reused enough and its size allows it to be persisted without memory pressure.",
          "Persist once, execute the necessary actions, measure again, and release the cache when finished."
        ],
        "outcome": "The improvement is accepted only if it reduces total work without introducing spills or prolonged memory occupation."
      }
    },
    "keyPoints": [
      "Transformations are lazy",
      "Actions boost jobs",
      "Cache is a measured decision"
    ],
    "decisions": [
      "Transformations are lazy",
      "Actions boost jobs",
      "Cache is a measured decision"
    ],
    "example": {
      "title": "Observe lazy evaluation",
      "note": "explain inspects the plan; count starts execution."
    },
    "pitfalls": [
      "Use collect on a large dataset",
      "Cache each DataFrame out of habit"
    ],
    "examDecision": "Distinguishes a transformation that returns a DataFrame from an action that returns data or writes output.",
    "checkpoint": {
      "question": "Does filter immediately execute a read?",
      "answer": "No; adds an operation to the lazy logic plan."
    }
  },
  "m04-l2": {
    "summary": "Reliable cleanup makes nulls, types, names, and rules explicit before publishing Silver.",
    "explanation": [
      "Converts types with cast or try_cast based on error policy, normalizes text with native functions, and decides whether a null is rejected, imputed, or preserved. A silent conversion to null must be measured.",
      "select with explicit expressions produces more reviewable contracts than dragging all columns. Add technical columns such as ingestion_ts or source_file when they provide traceability."
    ],
    "deepDive": {
      "mentalModel": "Cleaning data means converting source ambiguity into an explicit contract, not chaining dropna and cast until the job finishes. First, the table grain, canonical columns, types, allowed nulls, time zones and domain rules are defined. Afterwards, three results are distinguished: valid, correctable and rejected. try_cast converts rendering errors to null so they can be measured; Strict cast may be preferable when the contract requires failure. Silver must retain sufficient keys and evidence of origin to reconcile. A quality rule without a denominator, threshold and action is just an expression, not an operational control.",
      "mechanics": [
        "The analysis begins with schema and value profiling, not inferences from a few rows. The operations normalize names, trim text, convert types, and standardize timestamps into an information-preserving order. Each conversion creates a validity signal: for example, original amount is not null and null amount_decimal indicates failure. The lines should not disappear quietly; are counted and, if applicable, written to quarantine with reason, batch and route of origin.",
        "A Silver contract sets keys, semantics and expectations that consumers can assume. Nulls are interpreted by column: unknown is not equal to zero or an empty string. Quality is measured per batch and over time to detect degradation. Correcting at source is better than piling on heuristics, but the platform needs a policy in the meantime. The publication is blocked, warned or derived according to the impact and SLA defined by the owner."
      ],
      "concepts": [
        {
          "term": "grain",
          "definition": "Exact meaning of a row and minimum set of dimensions that identifies a fact.",
          "whyItMatters": "Avoid conceptual duplicates and incorrect aggregations in subsequent layers."
        },
        {
          "term": "try_cast",
          "definition": "Conversion that returns null when a value cannot be represented in the requested type.",
          "whyItMatters": "It allows errors to be quantified without aborting the entire batch, as long as the resulting null is controlled."
        },
        {
          "term": "Quarantine",
          "definition": "Governed destination for invalid records along with their cause and ingestion context.",
          "whyItMatters": "Preserves evidence and allows repair without contaminating the reliable board."
        }
      ],
      "workedScenario": {
        "situation": "Orders have amount as text; some use a decimal point, others say N/A and the dashboard adds the column.",
        "reasoning": [
          "Define DECIMAL, currency and supported formats policy before converting; preserve the original value.",
          "Normalize valid formats, apply try_cast and label failures with reason and batch.",
          "Publish only valid rows, measure ratio and compare sum with source control before meeting the SLA."
        ],
        "outcome": "Silver offers amounts with known semantics and a reconcilable quarantine, rather than invented zeros or silent losses."
      }
    },
    "keyPoints": [
      "Each null requires a policy",
      "The target schema must be explicit",
      "Native functions retain optimization"
    ],
    "decisions": [
      "Each null requires a policy",
      "The target schema must be explicit",
      "Native functions retain optimization"
    ],
    "example": {
      "title": "Defensive cleaning",
      "note": "Count the amounts converted to null before accepting the batch."
    },
    "pitfalls": [
      "Pad all nulls with zero",
      "Using SELECT * in a Silver contract"
    ],
    "examDecision": "For potentially invalid data, use tolerant conversion plus a metric or quarantine; don't hide losses.",
    "checkpoint": {
      "question": "What advantage does try_cast offer?",
      "answer": "Returns null for non-convertible values, allowing them to be measured and processed without aborting the entire query."
    }
  },
  "m04-l3": {
    "summary": "The join type expresses which rows should survive; cardinality and keys determine correctness and cost.",
    "explanation": [
      "Inner preserves coincidences; left retains all rows on the left; full preserves both sides. Before the join it checks for uniqueness: a duplicate dimension can multiply facts without producing an error.",
      "union combines by position and unionByName by name; none remove duplicates. Broadcast can avoid shuffle for a small side, but only after confirming size."
    ],
    "deepDive": {
      "mentalModel": "A join combines sets according to predicates, but its correctness depends on grain and cardinality rather than syntactic type. Inner preserves coincidences; left preserves all left rows; semi answers existence without adding columns; anti conserve absences. If a key is unique on one side and repeated on another, the result can legitimately multiply rows. If one to one was expected, that multiplication is a data or predicate defect. Before optimizing broadcast or partitions, declare which row each entry represents, normalize keys, and estimate counts. A fast join that doubles revenue is worse than a slow one: semantics and reconciliation are acceptance criteria.",
      "mechanics": [
        "Spark analyzes the condition and chooses physical strategy using sizes, statistics, hints and configuration. An equi-join can use broadcast hash if one side is small, or sort-merge with shuffles for large sides. The logical type determines row survival regardless of the strategy. Nulls do not equal other nulls under normal equality; If the business needs null-safe equivalence it must be consciously expressed. Incomplete predicates, such as omitting tenant_id, produce cross-matches.",
        "Validation compares count, distinct keys, non-matches, and multiplicity distribution. For rich facts with dimension type 1, the dimension must have one row per effective key. In SCD type 2, the condition includes temporal range and can detect overlaps. Semi and anti joins avoid dragging columns when only existence matters. Choosing semantics first limits the optimization space and provides invariants that must be maintained after any physical change."
      ],
      "concepts": [
        {
          "term": "Cardinality",
          "definition": "Multiplicity relationship between keys of two datasets, such as one-to-one or one-to-many.",
          "whyItMatters": "Predicts the number of rows and reveals accidental duplications."
        },
        {
          "term": "Left semi join",
          "definition": "Join that preserves left rows with at least one match without adding right columns.",
          "whyItMatters": "It is the precise and efficient way to filter by existence."
        },
        {
          "term": "Null-safe equality",
          "definition": "Comparison that considers two null equivalents through explicit semantics.",
          "whyItMatters": "Avoid assuming that ordinary SQL equality matches unknown values."
        }
      ],
      "workedScenario": {
        "situation": "Multitenant orders are matched with customers only by customer_id and revenue is doubled across countries.",
        "reasoning": [
          "Examine grain and verify that customer_id is only unique within tenant_id.",
          "Change the predicate to tenant_id plus customer_id and validate uniqueness of the dimension by that composite key.",
          "Reconcile count and amount before and after, and only then review the physical join strategy."
        ],
        "outcome": "The composite key restores the business correspondence and eliminates multiplications without hiding them with distinct."
      }
    },
    "keyPoints": [
      "Choose join by semantics",
      "Validate cardinality before and after",
      "Union does not dedupe"
    ],
    "decisions": [
      "Choose join by semantics",
      "Validate cardinality before and after",
      "Union does not dedupe"
    ],
    "example": {
      "title": "Join with composite keys",
      "note": "Compares row count and unmatched keys after the join."
    },
    "pitfalls": [
      "Join only by customer_id in a multitenant system",
      "Confusing union with deduplication"
    ],
    "examDecision": "If all source records must be kept even if there is a missing dimension, select left join.",
    "checkpoint": {
      "question": "What can an unexpected increase in ranks reveal?",
      "answer": "A many-to-many relationship or duplicate keys on the side that was believed to be unique."
    }
  },
  "m04-l4": {
    "summary": "Arrays, structs and maps can be transformed without losing the context of the parent row.",
    "explanation": [
      "explode creates one row per element; explode_outer preserves the row when the collection is null or empty. The fields of a struct are selected with dot notation and transform processes arrays without expanding them.",
      "When normalizing JSON, you preserve the parent record key and define what to do with empty arrays. Indefinitely inferring the production scheme causes source changes to alter results without review."
    ],
    "deepDive": {
      "mentalModel": "Complex types preserve structure: a struct groups fields with a schema, an array maintains a sequence, and a map associates keys with values. There is no need to convert JSON to strings or exploit everything immediately. The higher-order functions transform, filter, exists, and aggregate operate within an array preserving the parent row; field notation navigates structs; element_at queries collections. explode changes the grain when creating rows and therefore requires preserving keys from the parent. explode_outer maintains a representation when the collection is null or empty. Choosing between nested transformation and normalization depends on the consumer and semantics, not a limitation of Spark.",
      "mechanics": [
        "When reading with explicit schema, Spark renders the type tree and can prune nested fields into supported formats. select from a struct field does not force everything to be serialized as JSON. transform applies an expression to each element and returns an array; filter retains matching elements; aggregate reduces the collection. These operations maintain one row per parent entity and avoid shuffles that a normalization followed by regrouping could introduce.",
        "explode and posexplode are generators: they turn each element into a row, and posexplode adds position. The parent's stable key and any indexes needed to reconstruct identity must also be selected. With empty arrays, explode produces zero rows; explode_outer produces one with null element, which can be crucial in left semantics. After normalizing, the new grain and cardinality tests must be documented the same as any join."
      ],
      "concepts": [
        {
          "term": "Struct",
          "definition": "Composite value with named fields and types defined within a column.",
          "whyItMatters": "It allows you to maintain hierarchy and select attributes without losing the contract."
        },
        {
          "term": "Higher order function",
          "definition": "Expression that applies an operation to elements in a collection without converting them to separate rows.",
          "whyItMatters": "It preserves grain and often simplifies array transformations."
        },
        {
          "term": "explode_outer",
          "definition": "Generator that expands elements and preserves the parent with null when the collection does not contribute elements.",
          "whyItMatters": "Avoid losing parent entities when the absence of details is meaningful."
        }
      ],
      "workedScenario": {
        "situation": "Each order contains items and non-positive quantities need to be eliminated without losing still empty orders.",
        "reasoning": [
          "Initially maintain one row per order and apply filter to the array to remove invalid elements.",
          "Use explode_outer only on the lines table, preserving order_id and position to define the new grain.",
          "Validate number of orders, valid lines and parents without lines using separate metrics."
        ],
        "outcome": "A correct and reconcilable line table is obtained, while empty orders remain visible for quality."
      }
    },
    "keyPoints": [
      "explode changes cardinality",
      "explode_outer preserves parents without elements",
      "Nested schema must be versioned"
    ],
    "decisions": [
      "explode changes cardinality",
      "explode_outer preserves parents without elements",
      "Nested schema must be versioned"
    ],
    "example": {
      "title": "Normalize order lines",
      "note": "Decides if a row with a null sku should go to quarantine."
    },
    "pitfalls": [
      "Losing order_id when exploding items",
      "Using explode when transform maintains cardinality better"
    ],
    "examDecision": "Use explode to convert elements to rows; use struct or transform access if you don't need to increase rows.",
    "checkpoint": {
      "question": "When to choose explode_outer?",
      "answer": "When the parent row must be preserved even if the array is null or empty."
    }
  },
  "m04-l5": {
    "summary": "Windows calculate metrics per group without collapsing rows and allow deterministic deduplication.",
    "explanation": [
      "groupBy reduces each group; A window maintains each record and adds ranking, cumulative or previous values. The order must resolve ties for the result to be repeatable.",
      "To keep the most recent version, combine row_number with a sort by event_ts and a second stable field. dropDuplicates without temporal criteria does not express which version to keep."
    ],
    "deepDive": {
      "mentalModel": "A window computes over a set related to each row without collapsing it like groupBy. PARTITION BY defines the logical group, ORDER BY establishes sequence and the frame delimits which rows contribute. row_number assigns full priority only if the order contains a stable tiebreaker; rank and dense_rank express ties with different semantics. To deduplicate, you first define the identity of the event and which version should win; It is then sorted by business time, sequence, and a deterministic identifier. dropDuplicates expresses equality, not preference, and in batch it does not guarantee to keep the newest event. The result is validated by uniqueness and reconciliation of discarded versions.",
      "mechanics": [
        "Spark normally redistributes across partition columns and sorts within each partition to evaluate the window. Many small keys allow parallelism; a dominant key can produce a skewed partition. The default frame depends on function and order, so rollups should declare rowsBetween or rangeBetween when the difference matters. ORDER BY timestamp without tiebreaker leaves variable results if two events share a time.",
        "For the latest version, row_number over the business key sorted by descending event_ts and then descending ingest_id produces a single winner if ingest_id is stable. rank would retain several tied winners and does not comply with a table with one row per key. In streaming, deduplication also requires state and watermark limits, a different issue from batch. In all cases duplicate keys are counted afterwards and evidence of discards is retained if the business requires auditing."
      ],
      "concepts": [
        {
          "term": "Window specifications",
          "definition": "Definition of partition, order and frame used to calculate a function for each row.",
          "whyItMatters": "Determines both the semantics and data movement of a window."
        },
        {
          "term": "row_number",
          "definition": "Function that allocates a unique sequence within each partition according to the declared order.",
          "whyItMatters": "Allows you to select a single winner when the order is totally deterministic."
        },
        {
          "term": "Stable tiebreaker",
          "definition": "Additional unique or consistent order column used when the main criterion matches.",
          "whyItMatters": "Prevent retries from choosing different versions with the same timestamps."
        }
      ],
      "workedScenario": {
        "situation": "Two updates from the same client share updated_at, but one arrived later and contains the corrected email.",
        "reasoning": [
          "Define customer_id as identity and updated_at plus ingest_sequence as descending preference order.",
          "Compute row_number and keep rn equal to one, sending the other versions to deduplication evidence.",
          "Test with repartitioning and second run that the same record wins and that there is one row left per customer."
        ],
        "outcome": "Deduplication is reproducible and preserves late fixing without relying on physical file order."
      }
    },
    "keyPoints": [
      "Window does not collapse rows",
      "The order must be total",
      "Deduplicating requires a survival rule"
    ],
    "decisions": [
      "Window does not collapse rows",
      "The order must be total",
      "Deduplicating requires a survival rule"
    ],
    "example": {
      "title": "Last event by key",
      "note": "ingest_id breaks ties from event_ts and makes the output deterministic."
    },
    "pitfalls": [
      "Skip tiebreaker",
      "Use groupBy when detail columns are needed"
    ],
    "examDecision": "To choose one row per group based on priority, use row_number on a sorted window.",
    "checkpoint": {
      "question": "Why isn't dropDuplicates enough to pick the newest event?",
      "answer": "Because it eliminates duplicates without expressing a deterministic temporal priority."
    }
  },
  "m05-l1": {
    "summary": "The physical plan and its metrics indicate where the data is moved and processed.",
    "explanation": [
      "explain formatted separates logical and physical plan; Exchange usually indicates shuffle, and the join type shows the chosen strategy.",
      "Spark UI commits with bytes, duration, and distribution per task. Optimize one hypothesis at a time and maintain a baseline."
    ],
    "deepDive": {
      "mentalModel": "A Spark plan is an executable explanation of how a relational intent becomes distributed work. The logical plan preserves operations such as filter, projection and join; Catalyst analyzes and optimizes it; The physical plan chooses scans, join algorithms, exchanges and specific aggregations. explain formatted shows structure and estimates, but does not replace actual metrics. Spark UI reveals stages, tasks, bytes, shuffle, spill and timing after running. Competent reading connects the two: an Exchange anticipates redistribution, while metrics confirm its volume and balance. Optimizing means formulating a causal hypothesis, changing a single variable, and comparing against a semantically equivalent baseline.",
      "mechanics": [
        "Catalyst resolves attributes and types, applies rules such as predicate pushdown or column pruning, and estimates alternatives with available statistics. The physical plan may include BroadcastHashJoin, SortMergeJoin, scans, and Exchange. Adaptive Query Execution can modify certain decisions during execution by looking at actual sizes. That's why explain before executing and the final adaptive plan may differ. Outdated estimates help explain unexpected choices, but the visible operator alone does not prove that it is the bottleneck.",
        "Spark divides the plan into stages around broad dependencies, usually exchanges. Each stage contains tasks per partition. In Spark UI, median and maximum duration, input, shuffle read/write, spill, and scheduler time are compared. Many slow homogeneous tasks suggest general pressure; an extreme tail suggests skew. The optimization first preserves count and semantics, records plan and metrics and only then introduces changes such as broadcast, partitioning or layout."
      ],
      "concepts": [
        {
          "term": "Catalyst",
          "definition": "Spark query optimizer that parses expressions and transforms logical plans into physical alternatives.",
          "whyItMatters": "It allows reasoning about why different code can produce equivalent execution."
        },
        {
          "term": "Exchange",
          "definition": "Physical operator that redistributes data between executors and usually creates a stage boundary.",
          "whyItMatters": "Signals a potentially costly shuffle that needs to be confirmed with metrics."
        },
        {
          "term": "Adaptive plan",
          "definition": "Plan that AQE can review during execution using statistics observed at runtime.",
          "whyItMatters": "Explains strategy changes and partitions that do not appear in the initial plan."
        }
      ],
      "workedScenario": {
        "situation": "A join takes twenty minutes; explain shows SortMergeJoin and two Exchange, but the team proposes to increase the driver.",
        "reasoning": [
          "Relate the Exchanges to the stages and check bytes, maximum tasks and spill in Spark UI.",
          "Check sizes and statistics on both sides to decide if broadcast or skew correction is plausible.",
          "Apply an alternative, reconcile rows and compare final plan, runtime and shuffle with the baseline."
        ],
        "outcome": "The action is chosen by evidence of distributed motion; an irrelevant component is not increased by intuition."
      }
    },
    "keyPoints": [
      "Exchange signals redistribution",
      "Plan and metrics complement each other",
      "Measure before and after"
    ],
    "decisions": [
      "Exchange signals redistribution",
      "Plan and metrics complement each other",
      "Measure before and after"
    ],
    "example": {
      "title": "Physical plan",
      "note": "Look for Exchange, Scan and the join operator; then contrast in Spark UI."
    },
    "pitfalls": [
      "Adjust settings without baseline",
      "Interpret only the logical plan"
    ],
    "examDecision": "If they ask about skew, shuffle or spill, check stages and tasks in Spark UI, not just the total time.",
    "checkpoint": {
      "question": "What operator usually delimits a shuffle?",
      "answer": "Exchange on the physical plan."
    }
  },
  "m05-l2": {
    "summary": "Partitions determine parallelism, task size and number of files.",
    "explanation": [
      "spark.sql.shuffle.partitions controls partitions after SQL shuffles; spark.default.parallelism influences RDD operations and certain sources.",
      "repartition causes shuffle and can increase or redistribute; coalesce usually reduces without full shuffle. The goal is sufficiently numerous tasks and files of reasonable size."
    ],
    "deepDive": {
      "mentalModel": "A Spark partition is the unit of data that a task processes sequentially. The number and distribution of partitions delimit parallelism, overhead, memory per task and output files. Very few leave idle cores and create large tasks; Too many produce planning, connections, and small files. spark.sql.shuffle.partitions sets a starting point for SQL shuffles, although AQE can merge subsequent partitions. repartition introduces a redistribution to increase or balance; coalesce usually reduces by taking advantage of the existing distribution. There is no universal number. It is sized based on compressed volume, resources, operators and distribution, and validated with metrics by task and file size.",
      "mechanics": [
        "Input partitions come from files, blocks, and reader settings. After a wide dependency, Spark produces new shuffle partitions. Each task needs memory for its operators and writes intermediate blocks that other executors read. If a partition is huge, a task may spill to disk or fail; if it is lowercase, the fixed cost dominates. AQE can coalesce small partitions and split some skewed ones when its detection is applicable.",
        "repartition(n, columns) shuffles by hash or range and should be reserved for correcting distribution or preparing for later operations. coalesce(n) attempts to combine partitions without complete redistribution and may produce unequal sizes; coalesce(1) serializes writing and is rarely acceptable. For Delta tables, the layout and managed optimizations also influence files, so adjusting execution partitions should not become permanent storage micromanagement."
      ],
      "concepts": [
        {
          "term": "Partition",
          "definition": "Logical segment of a dataset that a Spark task processes on an executor.",
          "whyItMatters": "It connects data distribution with parallelism, memory and duration."
        },
        {
          "term": "Wide dependency",
          "definition": "Relationship in which an output partition requires data from multiple input partitions.",
          "whyItMatters": "It usually requires shuffle and creating a new execution stage."
        },
        {
          "term": "distribution",
          "definition": "An operation that redistributes data using shuffle to create a new physical partition.",
          "whyItMatters": "It can balance or increase parallelism, but it adds cost that must be amortized."
        }
      ],
      "workedScenario": {
        "situation": "One terabyte is aggregated with eight shuffle partitions into a sixty-four core cluster and OOMs appear per task.",
        "reasoning": [
          "Confirm in Spark UI that only eight tasks process huge partitions and that the distribution is not an isolated skew key.",
          "Increase shuffle partitions to an experimental value according to volume and allow AQE to merge small ones.",
          "Compare utilization, spill, duration and files produced, keeping the aggregate result identical."
        ],
        "outcome": "The job uses true parallelism and reduces memory per task without falling into thousands of tiny partitions."
      }
    },
    "keyPoints": [
      "Too few partitions limit parallelism",
      "Too many create overhead",
      "repartition and coalesce are not equivalent"
    ],
    "decisions": [
      "Too few partitions limit parallelism",
      "Too many create overhead",
      "repartition and coalesce are not equivalent"
    ],
    "example": {
      "title": "Conscious distribution",
      "note": "The value 200 is a test point, not a prescription; measures sizes and duration."
    },
    "pitfalls": [
      "Copy a fixed number to any volume",
      "coalesce to 1 before each write"
    ],
    "examDecision": "Use repartition to redistribute or increase; coalesce to reduce when you don't need total balancing.",
    "checkpoint": {
      "question": "What setting controls SQL shuffle partitions?",
      "answer": "spark.sql.shuffle.partitions."
    }
  },
  "m05-l3": {
    "summary": "Broadcast avoids moving the large side when the other safely fits into executors.",
    "explanation": [
      "BroadcastHashJoin distributes a small relation to each executor and shuffles the large one. The automatic threshold or broadcast hint influences Catalyst.",
      "An outdated estimate can broadcast too large and cause memory pressure. SortMergeJoin is reasonable for two large sides."
    ],
    "deepDive": {
      "mentalModel": "A broadcast join changes who moves. In a shuffle join both sides are redistributed by key; in BroadcastHashJoin the small side is collected and distributed to the executors to build a local hash table, so the large side partitions can be read where they are. The advantage depends on the actual serialized size and memory available on each executor, not on whether the dataset is called a dimension. Catalyst can choose broadcast with statistics and threshold, and a hint can influence it, but forcing an increasing ratio can cause OOM. When both sides are large, sort-merge is usually a reasonable strategy even if it involves shuffle.",
      "mechanics": [
        "The driver coordinates the materialization of the broadcast side and its distribution. Each executor retains a copy to resolve hits from its large partitions. The total cost multiplies that memory per executors and adds transfer time, but avoids writing and reading the large side shuffle. Projecting only necessary columns and filtering first can make a dimension eligible. Inaccurate statistics can prevent a useful broadcast or attempt one that is too large.",
        "A hint broadcast is a strong instruction, not a guarantee that the data will fit. Size after filters, variability between days, and memory should be checked along with other tasks. AQE can convert certain joins using observed sizes. If there is a skew in the large key, broadcast eliminates the join shuffle but not necessarily other operators or subsequent aggregation. The result is validated by cardinality in addition to time and bytes moved."
      ],
      "concepts": [
        {
          "term": "BroadcastHashJoin",
          "definition": "Join which replicates a small relationship and builds a local hash table on each executor.",
          "whyItMatters": "Avoid redistributing the large side when memory supports replication."
        },
        {
          "term": "Size statistics",
          "definition": "Estimation of the volume of a ratio used by the optimizer to compare strategies.",
          "whyItMatters": "An outdated estimate can lead to an inadequate physical plan."
        },
        {
          "term": "Hint",
          "definition": "Declarative indication that influences the strategy selected by Catalyst.",
          "whyItMatters": "It should be used with evidence because it can trump a safer adaptive decision."
        }
      ],
      "workedScenario": {
        "situation": "A 4TB fact table is joined each day with an 18MB filtered reference; both sides are shuffled.",
        "reasoning": [
          "Project the reference to necessary key and attributes and measure its effective size after the filter.",
          "Check statistics and test broadcast, verifying the final operator and memory of executors.",
          "Reconcile rows and compare shuffle, duration and stability over several days of growth."
        ],
        "outcome": "The reference is replicated with margin and the massive shuffle of facts disappears without compromising correctness."
      }
    },
    "keyPoints": [
      "Broadcast moves the small side",
      "Statistics matter",
      "Two large sides usually require shuffle"
    ],
    "decisions": [
      "Broadcast moves the small side",
      "Statistics matter",
      "Two large sides usually require shuffle"
    ],
    "example": {
      "title": "Explicit Broadcast",
      "note": "Confirm the actual dim size and plan operator."
    },
    "pitfalls": [
      "Broadcast of an unbounded dimension",
      "Force hint without checking memory"
    ],
    "examDecision": "With large facts and small dimension, broadcast can eliminate fact shuffle.",
    "checkpoint": {
      "question": "What dataset is replicated in BroadcastHashJoin?",
      "answer": "The small side of join."
    }
  },
  "m05-l4": {
    "summary": "Skew, shuffle and spill are different symptoms and require different evidence.",
    "explanation": [
      "Skew appears when few tasks last or read much longer than the rest. AQE can partition skewed partitions, but a dominant null key or incorrect layout may require filtering, salting, or preaggregation.",
      "Spill indicates that an operation uses disk due to lack of execution memory; OOM can come from collect, excessive broadcast or huge partitions. Adding memory without correcting the pattern only postpones the failure."
    ],
    "deepDive": {
      "mentalModel": "Shuffle describes data movement between partitions; skew describes inequality; spill describes disk usage when the state in memory does not fit. They can coexist, but they are not synonyms. A big shuffle can be balanced and finish correctly. A dominant key produces one or a few long tasks even if the rest finish quickly. Generalized spill can indicate overly large partitions, large aggregations, or insufficient memory. AQE adapts partitions and can mitigate some skewed joins, but it does not fix a null key that should be handled semantically or a collect call that overflows the driver. The diagnosis compares distribution by task and connects each symptom with the plan operator.",
      "mechanics": [
        "During a shuffle, map tasks write blocks per destination partition and reduce tasks retrieve them. If a key concentrates a large portion of rows, its partition receives many more bytes and determines the final queue. AQE can detect sizes above thresholds and split skewed partitions into compatible strategies. Salting artificially distributes a key, but requires recomposing results and increases complexity; filtering or separating a special category may be semantically better.",
        "Spill occurs when sort, hash, or aggregation structures release pages of memory to disk. A small amount does not prove a problem, while massive spill, garbage collection or OOM do justify reviewing sizes. Driver OOM is associated with collect, materialized broadcast, metadata or results; OOM executor occurs within tasks. Adding memory can relieve pressure, but first fix layout, projection, and algorithm to avoid paying for a logical defect."
      ],
      "concepts": [
        {
          "term": "Skew",
          "definition": "Extreme distribution in which a few partitions contain much more work than their peers.",
          "whyItMatters": "Explains long queues that are not improved by adding workers."
        },
        {
          "term": "Spill",
          "definition": "Temporary write to disk of execution state that does not fit in the available memory.",
          "whyItMatters": "It indicates memory pressure, although its severity must be quantified."
        },
        {
          "term": "AQE",
          "definition": "Adaptive Query Execution, a mechanism that reviews physical decisions with statistics observed during the run.",
          "whyItMatters": "You can merge partitions or mitigate skew without changing the declared logic."
        }
      ],
      "workedScenario": {
        "situation": "In a stage, 399 tasks last thirty seconds and one lasts fourteen minutes with an UNKNOWN key that concentrates 40%.",
        "reasoning": [
          "Classify the signal as skew and commit bytes and rows of the extreme task, not as a global lack of workers.",
          "Decide whether UNKNOWN should be separated semantically; evaluate AQE or salting only if the relationship requires normal join.",
          "Rerun and check distribution, same count and explicit treatment of the unknown category."
        ],
        "outcome": "The queue disappears through a defensible data rule and not through permanent oversizing."
      }
    },
    "keyPoints": [
      "Skew is unequal distribution",
      "Spill does not always equal failure",
      "AQE adapts the plan in runtime"
    ],
    "decisions": [
      "Skew is unequal distribution",
      "Spill does not always equal failure",
      "AQE adapts the plan in runtime"
    ],
    "example": {
      "title": "Detect dominant keys",
      "note": "Compare to the duration distribution per task in Spark UI."
    },
    "pitfalls": [
      "Disable AQE without cause",
      "Resolve OOM by increasing driver if an executor fails"
    ],
    "examDecision": "One extreme task among many quick ones suggests skew; Many spill tasks suggest general memory pressure or large partitions.",
    "checkpoint": {
      "question": "What signal distinguishes skew?",
      "answer": "A very unequal distribution of duration or bytes between tasks of the same stage."
    }
  },
  "m05-l5": {
    "summary": "Efficient diagnostics separate boot, library, driver and executor faults.",
    "explanation": [
      "A cluster that does not start is investigated in compute and configuration events; an import error in task logs points to dependencies; driver OOM is usually related to collect or metadata.",
      "Part from the exact message, correlate run, task and cluster, and reproduce with the least input. Simultaneously changing runtime, nodes and code destroys evidence."
    ],
    "deepDive": {
      "mentalModel": "Diagnosing begins by locating the phase of the failure: provisioning, initialization, dependency loading, planning, distributed execution or output commit. A cluster that never reaches RUNNING still has no useful stages; It is investigated in events and configuration. A ModuleNotFoundError belongs to the task environment. OOM driver and OOM executor point to different memories and patterns. A slow query requires plan, Spark UI, or Query Profile. The exact message, run_id, task_key, compute and timestamp form the minimum evidence. Changing runtime, size and code at the same time destroys causality. The method reproduces with the smallest input that preserves the symptom and modifies one variable per experiment.",
      "mechanics": [
        "The control plane records compute creation and state events; init scripts and libraries produce logs before or during boot. Once Spark executes, driver and executors generate logs and metrics linked to jobs and stages. Lakeflow Jobs adds task, intent, and result context. Identifying the last component that worked narrows the search: a permission denied when reading table is not fixed by reinstalling Python, and an instance failure does not appear in DESCRIBE HISTORY.",
        "Minimal reproduction preserves code version, parameters, identity, and a sample that triggers the bug. The runbook records hypothesis, change and result to avoid repeated trials. If the error disappears when reducing data, scale, distribution or memory is investigated; If it persists before reading, the environment and permissions are checked. After correcting, a test or alert is added that detects the cause sooner, not just a note about the symptom."
      ],
      "concepts": [
        {
          "term": "Failure phase",
          "definition": "Specific stage of the workload cycle in which it stops progressing correctly.",
          "whyItMatters": "Direct to the appropriate evidence surface and avoid irrelevant changes."
        },
        {
          "term": "Driver OOM",
          "definition": "Memory exhaustion in the coordinator process, often due to local results or excessive metadata.",
          "whyItMatters": "Requires a different diagnosis of task failure in executor."
        },
        {
          "term": "Minimum playback",
          "definition": "Smaller case that maintains the essential cause and conditions of the failure.",
          "whyItMatters": "It allows hypotheses to be tested quickly without losing causality."
        }
      ],
      "workedScenario": {
        "situation": "A Job fails before creating Spark UI; The compute event indicates that an init script cannot download a package.",
        "reasoning": [
          "Locate the initialization failure and preserve the event, path, network identity and script version.",
          "Verify repository, connectivity and fixed dependency with a test compute of identical configuration.",
          "Fix a cause, relaunch, and add a dependency check or prebuilt artifact."
        ],
        "outcome": "Recovery acts on the boot environment and avoids increasing workers or modifying transformations that were never executed."
      }
    },
    "keyPoints": [
      "Locate the fault phase first",
      "Driver and executor have different causes",
      "Change one variable per experiment"
    ],
    "decisions": [
      "Locate the fault phase first",
      "Driver and executor have different causes",
      "Change one variable per experiment"
    ],
    "example": {
      "title": "Avoid materializing in driver",
      "note": "Appends in a distributed manner before returning a small result."
    },
    "pitfalls": [
      "Reinstall libraries without reading the error",
      "Increase the driver for a skew problem"
    ],
    "examDecision": "Startup failure: compute events; slow query: Spark UI/Query Profile; library conflict: logs and versions.",
    "checkpoint": {
      "question": "Where do you start with a cluster that never started?",
      "answer": "In the compute and configuration event log, before Spark UI."
    }
  },
  "m06-l1": {
    "summary": "The transaction log sorts commits and allows consistent snapshots of Parquet files.",
    "explanation": [
      "Each operation writes atomic actions to _delta_log; readers construct a valid snapshot without observing partially published files.",
      "Optimistic concurrency detects conflicts when committing. ACID protects the table, but does not make logic that inserts duplicates idempotent."
    ],
    "deepDive": {
      "mentalModel": "A Delta table is an ordered history of actions on files, not a directory whose current contents are deduced by listing it. Each commit adds a version to the transaction log with files added, removed, and metadata. A reader rebuilds a consistent snapshot from log and checkpoints, and only reads active files in that version. Writers use optimistic concurrency: they work on a snapshot and when committing they check if concurrent changes conflict. ACID guarantees atomicity and isolation of the commit, but it does not know the business key nor does it prevent a pipeline append from inserting the same request twice. Idempotence belongs to logic and must be designed around these guarantees.",
      "mechanics": [
        "The writer produces new data files and prepares AddFile and RemoveFile actions, among others. Atomic publishing of the new version record makes all or none of the change visible. Removed files may remain physically for time travel until cleaned. Log checkpoints compact metadata to speed reconstruction, but they are not Structured Streaming checkpoints. Manipulating files directly bypasses the protocol and can leave the snapshot and storage at odds.",
        "Concurrency validation compares what is read and written by the transaction with subsequent commits. Operations over independent regions can coexist; others crash and must be retried on a new snapshot. DESCRIBE HISTORY shows operations, actors and parameters useful for auditing. However, a blind append retry may commit another valid commit with duplicate rows. Keys, deterministic MERGE or batch markers translate the concept of safe repetition to the domain."
      ],
      "concepts": [
        {
          "term": "Transaction log",
          "definition": "Versioned sequence of actions that defines metadata and active files of a Delta table.",
          "whyItMatters": "It is the source of truth for snapshots, history and concurrency."
        },
        {
          "term": "Optimistic concurrency",
          "definition": "Model in which writers advance without global blocking and validate conflicts when committing.",
          "whyItMatters": "It allows parallelism, but requires handling retries and conflicting operations."
        },
        {
          "term": "Idempotence",
          "definition": "Property by which repeating an operation with the same input produces the same logical state.",
          "whyItMatters": "ACID does not provide it automatically and is essential for secure retries."
        }
      ],
      "workedScenario": {
        "situation": "Two Jobs simultaneously update different partitions; one fails due to conflict and is automatically retried.",
        "reasoning": [
          "Confirm that the conflict is transactional and review which files or predicates each operation read and wrote.",
          "Ensure that the retry rebuilds its source deterministically and uses MERGE or bounded replacement, not duplicate append.",
          "Validate history, keys and counts after new commit to demonstrate a single business state."
        ],
        "outcome": "The table preserves atomic commits and retry resolves concurrency without creating logically valid duplicates."
      }
    },
    "keyPoints": [
      "The log defines the snapshot",
      "Readers and writers can work concurrently",
      "ACID does not replace idempotent keys"
    ],
    "decisions": [
      "The log defines the snapshot",
      "Readers and writers can work concurrently",
      "ACID does not replace idempotent keys"
    ],
    "example": {
      "title": "Commit history",
      "note": "Relates operation, user and parameters to the investigated incident."
    },
    "pitfalls": [
      "Modify Delta files outside of the protocol",
      "Confusing atomic commit with deduplication"
    ],
    "examDecision": "To audit changes use DESCRIBE HISTORY; for older content use time travel while it is on hold.",
    "checkpoint": {
      "question": "What prevents a reader from seeing half writing?",
      "answer": "The snapshot defined by an atomic commit of the transaction log."
    }
  },
  "m06-l2": {
    "summary": "Managed and external describe the life cycle; an eligible external Delta can be converted with SET MANAGED.",
    "explanation": [
      "In a managed table, Unity Catalog manages data and metadata; in an external table it governs the object, but DROP TABLE does not delete the files from the external location.",
      "ALTER TABLE … SET MANAGED preserves name, history, permissions and views. Requires Delta and compute compatible; Before conversion, inventory all readers, features, optimizations, and streams. UNSET MANAGED allows rollback within the documented window."
    ],
    "deepDive": {
      "mentalModel": "Managed and external describe lifecycle and location control; They do not describe whether a table is Delta, safe, or externally accessible. In a Unity Catalog managed table, Databricks manages location and files along with metadata and can apply managed capabilities such as predictive optimization where appropriate. In an external table, files remain under a governed path that the organization controls; DROP TABLE removes the object from the catalog, but not the bytes. Both need privileges and can use Delta. For an eligible external Delta, ALTER TABLE SET MANAGED converts the object while retaining name, permissions, views, configuration, and history; it is not equivalent to creating a CTAS copy.",
      "mechanics": [
        "When creating a managed table without LOCATION, Unity Catalog determines a location within the configured managed storage. The user works with the name and avoids path dependencies. When you delete it, the service manages data according to the applicable behavior and retention. This property enables more automated optimizations because Databricks controls both metadata and layout. It does not mean that any user can discover it: ownership and grants still govern the object.",
        "An external table references a location covered by external location and a storage credential. To convert it with SET MANAGED it must be Delta and, according to current documentation, run on Serverless or Databricks Runtime 17.3 LTS or higher; Databricks readers and writers must be inventoried and updated, OPTIMIZE operations are paused, and streams are restarted after the change. The conversion copies data and log, makes a short final change, preserves temporary redirection for path accesses, and allows rollback with UNSET MANAGED during the documented 14-day window."
      ],
      "concepts": [
        {
          "term": "Managed table",
          "definition": "Table whose data and metadata storage is managed by Unity Catalog as a lifecycle unit.",
          "whyItMatters": "This is the recommended option when you do not need to control an external location."
        },
        {
          "term": "External table",
          "definition": "A governed object whose files reside in a separately managed external location.",
          "whyItMatters": "It allows interoperability or cloud control, but DROP does not delete those files."
        },
        {
          "term": "SET MANAGED",
          "definition": "ALTER TABLE operation that converts an eligible external Delta to managed while preserving identity, history, permissions, and views.",
          "whyItMatters": "Prevents loss of CTAS continuity and offers controlled redirection and rollback."
        }
      ],
      "workedScenario": {
        "situation": "A 1TB Delta external must adopt managed optimization; it still has readers per route, two streams and a nightly Job OPTIMIZE.",
        "reasoning": [
          "Check format, DESCRIBE DETAIL, runtime versions, external clients and feature compatibility before authorizing the conversion.",
          "Pause OPTIMIZE, schedule the window and run ALTER TABLE catalog.schema.table SET MANAGED from compute compatible.",
          "Restart streams, migrate path accesses to names, and maintain an UNSET MANAGED plan within the rollback window."
        ],
        "outcome": "The table retains identity and history as managed, consumers are verified, and rollback remains available during the transition."
      }
    },
    "keyPoints": [
      "Both can be Delta",
      "SET MANAGED preserves continuity",
      "Conversion requires inventory and restart of streams"
    ],
    "decisions": [
      "Both can be Delta",
      "SET MANAGED preserves continuity",
      "Conversion requires inventory and restart of streams"
    ],
    "example": {
      "title": "Convert and verify",
      "note": "Use Serverless or DBR 17.3 LTS+; OPTIMIZE pause and validate all readers and writers before and after."
    },
    "pitfalls": [
      "Use CTAS and lose continuity unnecessarily",
      "Convert without inventorying clients by route or restarting streams"
    ],
    "examDecision": "To make an external Delta eligible while preserving history and permissions, use SET MANAGED; CTAS does not offer the same continuity.",
    "checkpoint": {
      "question": "What does SET MANAGED preserve versus recreating by CTAS?",
      "answer": "Table identity, configuration, permissions, views, and history, plus a controlled rollback path."
    }
  },
  "m06-l3": {
    "summary": "DDL defines objects and DML modifies rows; MERGE expresses upsert with clear conditions.",
    "explanation": [
      "CREATE OR REPLACE redefines a table atomically; INSERT adds, UPDATE changes, and DELETE deletes rows. MERGE combines matches and non-matches from a source.",
      "The MERGE source must have at most one relevant row per key or pre-define which one wins. Add a sequence condition to prevent an old event from overriding a recent one."
    ],
    "deepDive": {
      "mentalModel": "DDL defines structure and objects; DML expresses changes over rows. In Delta, CREATE, ALTER or REPLACE modify metadata and versions; INSERT, UPDATE, DELETE and MERGE produce new commits. MERGE does not simply mean synchronize: it compares a source with a destination using a condition and applies clauses to matching or unmatched rows. To be deterministic, the source must produce at most one winning version per key and the rules must decide how to handle late events. UPDATE SET * does not fix an ambiguous source. Key, sequence, deletion semantics and retry behavior are defined before writing.",
      "mechanics": [
        "MERGE builds matches between source and target. WHEN MATCHED can update or delete under one condition; WHEN NOT MATCHED can insert; other supported clauses cover unsourced target rows. Delta validates that multiple source rows do not attempt to ambiguously modify the same target row according to the current semantics. Deduplicate with window and untie before MERGE converts a batch of events into a deterministic source.",
        "The sequence condition prevents an old event from overwriting recent state: an update is only applied if the source.sequence exceeds or equals the one preserved according to the contract. Deletes can be represented with a CDC operation or a logical flag. For retry, the same source and key must end in the same state. Operation and history metrics allow you to reconcile inserted, updated and deleted with the input batch."
      ],
      "concepts": [
        {
          "term": "DDL",
          "definition": "Definition language that creates or modifies objects, schema, and properties.",
          "whyItMatters": "Distinguishes structural changes from row modifications."
        },
        {
          "term": "MERGE",
          "definition": "Delta operation that applies conditional clauses based on a coincidence between a source and a destination.",
          "whyItMatters": "Implements upsert and CDC when key and order are well defined."
        },
        {
          "term": "Sequence",
          "definition": "Monotonic business or source value that orders versions of the same entity.",
          "whyItMatters": "Prevents late events from reverting to a more recent state."
        }
      ],
      "workedScenario": {
        "situation": "A batch contains two changes from client 42 and the oldest appears next in the file in physical order.",
        "reasoning": [
          "Define customer_id as key and source_lsn as authoritative sequence, ignoring file order.",
          "Select a winning row by key and apply MERGE only if its sequence exceeds that of the target.",
          "Repeat the batch and reconcile metrics to verify that the status and number of rows do not change."
        ],
        "outcome": "The client keeps the newest version and the pipeline supports out-of-order and retries without duplication."
      }
    },
    "keyPoints": [
      "CREATE OR REPLACE replaces the object",
      "MERGE needs deterministic source",
      "The sequence protects from old events"
    ],
    "decisions": [
      "CREATE OR REPLACE replaces the object",
      "MERGE needs deterministic source",
      "The sequence protects from old events"
    ],
    "example": {
      "title": "Upsert with sequence",
      "note": "Deduplicates updates by customer_id before the MERGE."
    },
    "pitfalls": [
      "Multiple source rows for a key",
      "UPDATE without temporary condition in CDC"
    ],
    "examDecision": "To insert and update based on match use MERGE; for pure append use INSERT.",
    "checkpoint": {
      "question": "Why condition updated_at?",
      "answer": "So that an old late event does not revert to the new state."
    }
  },
  "m06-l4": {
    "summary": "Schema enforcement rejects incompatibilities; schema evolution accepts explicitly configured changes.",
    "explanation": [
      "Enforcement avoids writing columns or types that are incompatible with the contract. Evolution can add columns during append or merge when enabled by operation or supported configuration.",
      "Accepting new columns does not mean accepting any type or semantic changes. Bronze may be more forgiving; Silver must control contract, nulls and consumers."
    ],
    "deepDive": {
      "mentalModel": "Schema enforcement protects the table against incompatible writes; schema evolution modifies the contract under explicit authorization. Enforcement compares names, types, and structure with the target schema and avoids silently accepting impossible data. Evolution can add columns or make supported changes when enabled in the appropriate operation. It is not a license for a column to change meaning or to trigger global autoMerge without review. Bronze can tolerate new attributes so as not to lose intake; Silver must decide if they are valid, how they are populated historically, and which consumers are broken. The schema is syntax, while the contract includes semantics and quality.",
      "mechanics": [
        "During append or MERGE, Delta analyzes the input schema. Without evolution, an extra column or incompatible type causes an error instead of writing a heterogeneous set. mergeSchema and supported evolution clauses authorize local changes; autoMerge extends session behavior and increases the risk of accidental acceptance. Column mapping and protocol features determine compatibility of certain changes such as renaming or deleting without rewriting.",
        "A secure evolution records producer, reason, compatibility and plan for existing data. Adding a nullable column is usually supported physically, but can break a consumer that uses SELECT * or expects exact JSON. Changing STRING to INT is not resolved by declaring evolution if values ​​and semantics are not convertible. It is tested with real readers, null ratio is monitored and promoted from Bronze to Silver only after validating the contract."
      ],
      "concepts": [
        {
          "term": "Schema enforcement",
          "definition": "Write validation that rejects data that does not comply with the schema supported by the table.",
          "whyItMatters": "Prevents silent corruption and makes producer changes visible."
        },
        {
          "term": "Schema evolution",
          "definition": "Controlled change of the target schema during supported operations.",
          "whyItMatters": "Allows you to adapt columns without deactivating the general protection."
        },
        {
          "term": "Column mapping",
          "definition": "Delta functionality that identifies columns beyond their physical name and enables certain metadata changes.",
          "whyItMatters": "Affects popularity, drops and customer compatibility."
        }
      ],
      "workedScenario": {
        "situation": "The provider adds loyalty_tier to JSON; Bronze should follow, but a Silver model requires known values.",
        "reasoning": [
          "Allow the additive column in Bronze locally and record when it appeared and its presence rate.",
          "Define domain, default or nullability with the owner before incorporating it into the Silver contract.",
          "Test consumers and deploy the Silver evolution as a versioned change, maintaining quarantine for invalid values."
        ],
        "outcome": "Ingest does not lose events and the trusted layer only exposes the new attribute when its semantics are agreed upon."
      }
    },
    "keyPoints": [
      "Enforcement protects the contract",
      "Evolution is opt-in",
      "Syntactic change does not guarantee semantic compatibility"
    ],
    "decisions": [
      "Enforcement protects the contract",
      "Evolution is opt-in",
      "Syntactic change does not guarantee semantic compatibility"
    ],
    "example": {
      "title": "Controlled evolution",
      "note": "Register new columns and test consumers before propagating them to Silver."
    },
    "pitfalls": [
      "Enable global autoMerge without governance",
      "Change STRING to INT assuming automatic evolution"
    ],
    "examDecision": "If expected additive columns arrive, enable evolution locally; for contract errors, let enforcement fail.",
    "checkpoint": {
      "question": "Does mergeSchema convert any incompatible types?",
      "answer": "No; facilitates compatible changes, especially additive columns, but does not remove type restrictions."
    }
  },
  "m06-l5": {
    "summary": "Time travel queries retained snapshots; VACUUM removes files no longer referenced after a threshold.",
    "explanation": [
      "VERSION AS OF and TIMESTAMP AS OF allow you to reproduce a previous reading if logs and files exist. RESTORE creates a new commit that returns the table to the chosen state.",
      "VACUUM recovers storage, but limits time travel and can affect long-lasting readers if retention is reduced inconsiderately. History does not guarantee that historical archives remain available."
    ],
    "deepDive": {
      "mentalModel": "Time travel, RESTORE and VACUUM operate on different dimensions of history. Time travel reads a previous snapshot by version or timestamp, as long as necessary logs and files are still retained. RESTORE creates a new commit whose logical state references the content of a chosen version; it does not delete subsequent versions of history. VACUUM physically deletes files that are no longer active and exceed the safe threshold, reducing the actual time travel window. OPTIMIZE, on the other hand, reorganizes the layout and is not a history cleanup. Retention is designed with retrieval, concurrent readers, and regulations; DESCRIBE HISTORY alone does not guarantee that an old snapshot remains materializable.",
      "mechanics": [
        "Each commit logically removes files but the bytes can be preserved. VERSION AS OF rebuilds the active list at that point and reads those files. If VACUUM has already removed them, keeping log entries is not enough. RESTORE calculates actions so that the current state corresponds to the target snapshot and publishes another version, allowing the recovery to be audited. Before restoring, it is advisable to consult the snapshot and quantify the impact.",
        "VACUUM determines files not referenced by snapshots within retention and deletes them. Reducing security controls without ensuring that long-lasting writers or readers do not exist can cause failures or loss of recovery. Data retention, log, and CDF are related but not identical settings. A runbook specifies RPO, required period, external copies if applicable, and who authorizes an aggressive cleanup."
      ],
      "concepts": [
        {
          "term": "Time travel",
          "definition": "Reading a historical Delta snapshot using available version or timestamp.",
          "whyItMatters": "Allows auditing, replay and validation before a recovery."
        },
        {
          "term": "RESTORE",
          "definition": "Operation that publishes a new commit to return the logical state to a previous snapshot.",
          "whyItMatters": "Recovers without manually rewriting files or deleting subsequent history."
        },
        {
          "term": "VACUUM",
          "definition": "Physical removal of obsolete files that exceed the retention policy.",
          "whyItMatters": "Saves storage, but limits actual recovery and time travel."
        }
      ],
      "workedScenario": {
        "situation": "An accidental DELETE affected Gold today; history shows the previous version and VACUUM has not been run.",
        "reasoning": [
          "Review the previous version and compare counts and metrics to confirm that it represents the correct state.",
          "Pause sensitive consumers and execute RESTORE authorized to that version, recording the new commit.",
          "Validate data and dependencies, resume service and correct controls that allowed the DELETE."
        ],
        "outcome": "The table retrieves the valid state in an auditable manner and preserves the complete sequence of the incident."
      }
    },
    "keyPoints": [
      "Time travel depends on retention",
      "RESTORE adds a commit",
      "VACUUM is not compaction"
    ],
    "decisions": [
      "Time travel depends on retention",
      "RESTORE adds a commit",
      "VACUUM is not compaction"
    ],
    "example": {
      "title": "Compare and restore",
      "note": "Validate the snapshot before restoring; RESTORE does not erase subsequent history."
    },
    "pitfalls": [
      "Use VACUUM to compact files",
      "Reduce retention by ignoring concurrent readers"
    ],
    "examDecision": "OPTIMIZE addresses layout; VACUUM removes obsolete files; RESTORE logically reverts to a snapshot.",
    "checkpoint": {
      "question": "Does DESCRIBE HISTORY guarantee unlimited time travel?",
      "answer": "No; can list versions whose files are no longer retained."
    }
  },
  "m07-l1": {
    "summary": "Medallion separates data responsibilities, it does not force you to copy each row three times.",
    "explanation": [
      "Bronze retains fidelity and traceability; Silver applies contracts and formation; Gold publishes consumer-oriented models.",
      "Each border must have an owner, a quality rule and a re-execution strategy. A layer is only justified if it changes guarantees or consumers."
    ],
    "deepDive": {
      "mentalModel": "Medallion is a separation of responsibilities and trust levels, not an obligation to physically triple all data. Bronze preserves a faithful and reproducible representation of the arrival; Silver applies contracts, deduplication and compliance; Gold publishes consumer-oriented models. Some sources or results may skip a materialization if traceability, SLA, and recovery are maintained. Each border must answer what guarantees are added, who is the owner and how it is repaired. A layer named Silver that only copies columns adds no value. The design is evaluated by replayability, isolation from source changes, and contract clarity, not by the number of color folders.",
      "mechanics": [
        "Bronze typically adds ingestion, batch, and origin metadata while avoiding irreversible transformations. This allows data to be reinterpreted when a rule changes without revisiting the source. Silver reads Bronze incrementally, normalizes types and keys, and separates invalid ones. Gold can be added or modeled based on specific queries. Delta tables offer cross-boundary commits, so each layer can be retried and audited with an explicit contract.",
        "Materializing has storage and latency costs, but provides decoupling and recovery. One view may be enough for a stable light transformation; a table may be necessary when reusing a lot or protecting from a volatile source. Lineage should allow a Gold metric to be traced back to previous records and rules. Retention and access may differ: not all consumers need to see sensitive Bronze payload."
      ],
      "concepts": [
        {
          "term": "Bronze",
          "definition": "Ingestion layer that preserves source data and sufficient context for replay and auditing.",
          "whyItMatters": "Isolates source changes and avoids relying on impossible re-extraction."
        },
        {
          "term": "Silver",
          "definition": "Layer of entities or formed events that comply with defined types, keys and quality rules.",
          "whyItMatters": "Provides a reusable and reliable base for different products."
        },
        {
          "term": "Gold",
          "definition": "Layer of data products optimized for specific questions and consumers.",
          "whyItMatters": "Translate trusted entities into metrics and models with consumer SLAs."
        }
      ],
      "workedScenario": {
        "situation": "Device telemetry is used for raw auditing, operational alerts, and an aggregated monthly report.",
        "reasoning": [
          "Preserve payload and file metadata in Bronze for replay, with restricted access.",
          "Normalize device, timestamp and quality in Silver, separating invalid and duplicate events.",
          "Create Gold for alerts and monthly aggregates according to SLA, materializing only where isolation or cost improves."
        ],
        "outcome": "Each consumer receives the appropriate level of detail and trust without imposing three identical copies."
      }
    },
    "keyPoints": [
      "Bronze prioritizes replay",
      "Silver conforms",
      "Gold serves use cases"
    ],
    "decisions": [
      "Bronze prioritizes replay",
      "Silver conforms",
      "Gold serves use cases"
    ],
    "example": {
      "title": "Explicit responsibilities",
      "note": "In production it adds types, deduplication and rejection metrics."
    },
    "pitfalls": [
      "Treat medallion as physical obligation",
      "Clean Bronze until you lose the original"
    ],
    "examDecision": "Associate re-executable raw data with Bronze, validated entities with Silver, and business metrics with Gold.",
    "checkpoint": {
      "question": "Where should the original reproducible data be kept?",
      "answer": "In Bronze, with source metadata and without destructive transformations."
    }
  },
  "m07-l2": {
    "summary": "Silver turns source data into trusted entities using measurable contracts.",
    "explanation": [
      "Normalizes types, keys and time zones; deduplicates with deterministic rules and separates records that violate the contract.",
      "Quality is not equivalent to discarding: observe, quarantine or fail according to impact and possibility of repair."
    ],
    "deepDive": {
      "mentalModel": "Silver converts records from a source into entities and events with shared meaning. The process begins by declaring grain and key, then types, time zones, deduplication, references and quality rules. Conforming does not mean erasing every anomaly: it means deciding what is valid, what can be corrected and what is quarantined, preserving evidence. A reusable Silver table prevents each team from interpreting customer_id or revenue differently. Your contract needs owner, SLA and change strategy. The rules must be measurable by batch and temporally, because 99% validity can hide deterioration concentrated in one country or one source.",
      "mechanics": [
        "The transformation preserves source identifiers and adds canonical keys. Types are converted with error signals; timestamps are normalized maintaining correct zone or instant; Repeated events are ordered by stable sequence. Joins with references are validated by cardinality. Failed rows are tagged with rule and context, and summary metrics total, valid, rejected, and corrected. This accounting allows Silver to Bronze to be reconciled.",
        "The Silver contract is published along with comments, expectations or applicable tests. NOT NULL and CHECK can protect certain Delta invariants, while other rules require pipeline evaluation. Informational restrictions are not always physically enforced and should not be confused with validation. When the producer changes, Bronze absorbs the arrival and Silver negotiates the evolution; so consumers don't receive new semantics by accident."
      ],
      "concepts": [
        {
          "term": "Compliance",
          "definition": "Process of converting heterogeneous representations to shared keys, types, and semantics.",
          "whyItMatters": "It makes data from multiple sources comparable and subsequent models reusable."
        },
        {
          "term": "quality rule",
          "definition": "Measurable condition with scope, threshold and agreed action upon non-compliance.",
          "whyItMatters": "Converts a data assumption into an operational control."
        },
        {
          "term": "Reconciliation",
          "definition": "Quantitative verification that inputs, outputs and discards explain the entire processing.",
          "whyItMatters": "Detects losses or silent multiplications during transformation."
        }
      ],
      "workedScenario": {
        "situation": "Two CRMs use different identifiers and time zones for customers and both feed global campaigns.",
        "reasoning": [
          "Define a canonical key and linking rules, preserving original identifiers and provenance system.",
          "Normalize timestamps to a common semantics and measure ambiguities, duplicates, and unresolved links.",
          "Publish Silver only with approved rules, leaving ambiguous cases in quarantine for owner resolution."
        ],
        "outcome": "Campaigns use a defensible client entity and exceptions remain visible instead of being arbitrarily merged."
      }
    },
    "keyPoints": [
      "Explicit contract",
      "Traceable quarantine",
      "Metrics by rule"
    ],
    "decisions": [
      "Explicit contract",
      "Traceable quarantine",
      "Metrics by rule"
    ],
    "example": {
      "title": "Separate valid",
      "note": "Also publish the reason and the rejected row to a quarantine table."
    },
    "pitfalls": [
      "Discard without counting",
      "Mix technical and business rules"
    ],
    "examDecision": "Failure due to corruption that invalidates the dataset; Quarantine fixable errors without stopping valid data.",
    "checkpoint": {
      "question": "What should accompany a quarantine?",
      "answer": "Original record, failed rule, time and batch reference."
    }
  },
  "m07-l3": {
    "summary": "Gold can publish tables, views, materialized views or streaming tables depending on freshness and cost.",
    "explanation": [
      "A view computes by querying; a materialized view preserves results and refreshes; a streaming table processes incremental inputs; a table is maintained by an explicit load.",
      "The choice depends on latency, change pattern and recomputation cost, not that Gold always means physical table."
    ],
    "deepDive": {
      "mentalModel": "Gold is a data interface for a decision or application. It can be a table, view, materialized view or streaming table; The choice balances freshness, recomputation cost, complexity, and resilience. A view calculates by consulting and maintains maximum relevance, but transfers cost and variability to the consumer. A materialized view physically maintains results and Databricks manages their updating according to capabilities. A table created by Job offers explicit control. A streaming table represents continuous incremental ingestion or transformation. Before choosing, metric, grain, dimensions, SLA and query pattern are defined. Gold is not simply the last SELECT statement from Silver.",
      "mechanics": [
        "A view saves the query and applies permissions on the object, but the engine executes its dependencies when it is used. A materialized view stores results and the system decides how to refresh them incrementally when it can, which reduces read latency in exchange for maintenance. Jobs output tables are updated with the semantics implemented by the workflow. The consumer must know the periodicity and cut-off time to interpret figures.",
        "The physical design follows the questions: frequent filters, temporal range, cardinality and concurrency. The Gold table includes descriptions and quality checks derived from Silver. If several metrics share a definition, centralizing them avoids divergence; If they have incompatible grains, mixing them can double. Access is granted to the stable product and sensitive details are restricted. The SLA includes freshness, availability and behavior when the update fails."
      ],
      "concepts": [
        {
          "term": "Materialized view",
          "definition": "Query whose result is stored and maintained through a managed update.",
          "whyItMatters": "Reduces read cost for repeated transformations and can take advantage of incremental maintenance."
        },
        {
          "term": "Freshness",
          "definition": "Age of the data published regarding the event or outage expected by the consumer.",
          "whyItMatters": "Determines if schedule, incremental update, and alerts comply with the product."
        },
        {
          "term": "data product",
          "definition": "Dataset with explicit consumer, semantics, owner, quality and SLA.",
          "whyItMatters": "It forces us to design Gold as a contract of use and not as technical waste."
        }
      ],
      "workedScenario": {
        "situation": "A dashboard queries every minute for a 5 TB aggregation that changes every fifteen minutes and takes forty seconds.",
        "reasoning": [
          "Define that the required freshness is fifteen minutes and that hundreds of readings repeat the aggregation exactly.",
          "Evaluate a materialized view or incremental table that maintains the result, versus recalculating a view on each query.",
          "Measure refresh time, read latency, cost and failure behavior before setting the contract."
        ],
        "outcome": "The product serves consistent results with low latency and explicit freshness, without redundant recomputation."
      }
    },
    "keyPoints": [
      "View calculates on reading",
      "MV materializes and refreshes",
      "Streaming table processes incrementally"
    ],
    "decisions": [
      "View calculates on reading",
      "MV materializes and refreshes",
      "Streaming table processes incrementally"
    ],
    "example": {
      "title": "Gold object materialized",
      "note": "Validates support and environment refresh policy."
    },
    "pitfalls": [
      "Use view for expensive aggregation highly consulted",
      "Choose streaming without freshness requirement"
    ],
    "examDecision": "For persisted results and managed refresh, choose materialized view; for always current logic when querying, view.",
    "checkpoint": {
      "question": "What differentiates a MV from a view?",
      "answer": "The VM stores and refreshes results; the view stores the query."
    }
  },
  "m07-l4": {
    "summary": "A dimensional model separates measures of events and descriptive context.",
    "explanation": [
      "The fact table sets an unambiguous grain and contains keys and measures; Dimensions describe customer, product or time.",
      "Grain is defined before columns. Mixing one row per order with one per line doubles amounts and breaks aggregations."
    ],
    "deepDive": {
      "mentalModel": "Dimensional modeling organizes measurable facts around descriptive context. A fact table declares a grain and contains measures and keys to dimensions; A dimension describes entities such as customer, product, or date. The star schema promotes understandable queries and avoids joining unnecessary normalized strings for BI. The central decision is the grain: a row per order line is not a row per order or per day. Mixing measurements of different grains produces double counting. Slowly changing dimensions determine whether a query should see current attributes or those in effect when the event occurred. Surrogate keys and temporal ranges make that history explicit.",
      "mechanics": [
        "In a transactional event, each event is inserted into the defined grain and additive measures can be added over compatible dimensions. A type 1 dimension overrides attributes and represents current state. Type 2 closes the previous version and opens another valid version, preserving history. When loading a fact, the valid dimensional version for the event timestamp is resolved, usually with a business key and time range.",
        "Surrogate keys separate warehouse identity from changing source keys. A date dimension provides consistent calendar attributes. The primary/foreign key relationships in Unity Catalog can be informative and helpful to tools, but effective guarantees must be validated against capabilities. The model is tested with reconciliation queries and late cases: a segment change received late should not reallocate historical sales if the contract requires time perspective."
      ],
      "concepts": [
        {
          "term": "Grain indeed",
          "definition": "Exact event or level that represents a fact table row.",
          "whyItMatters": "It is the basis for interpreting measurements and avoiding double counting."
        },
        {
          "term": "SCD dimension type 2",
          "definition": "Dimension that preserves versions with validity intervals to represent historical changes.",
          "whyItMatters": "It allows you to analyze events with the context that was valid when they occurred."
        },
        {
          "term": "Substitute key",
          "definition": "Stable internal identifier assigned to a dimensional version, separate from the source key.",
          "whyItMatters": "Resolves multiple sources and versions without relying on mutable operational identifiers."
        }
      ],
      "workedScenario": {
        "situation": "A client changes region in July; Finance should attribute June sales to the old region and new sales to the current one.",
        "reasoning": [
          "Choose SCD type 2 because the analysis requires historical context, not just the most recent attribute.",
          "Close the old version and create another one with non-overlapping ranges and a new surrogate key.",
          "Resolve each fact by customer_id and order_ts, validating that exactly one dimensional version matches."
        ],
        "outcome": "Sales maintain correct temporal attribution and changing regions does not rewrite financial history."
      }
    },
    "keyPoints": [
      "Define grain first",
      "Facts contain measurements",
      "Dimensions provide context"
    ],
    "decisions": [
      "Define grain first",
      "Facts contain measurements",
      "Dimensions provide context"
    ],
    "example": {
      "title": "Made to line grain",
      "note": "Declares that each row represents exactly one order line."
    },
    "pitfalls": [
      "Do not declare grain",
      "Add repeat order amount per line"
    ],
    "examDecision": "If a metric is duplicated when joining, check grain and cardinality before changing SQL.",
    "checkpoint": {
      "question": "What is defined first in a fact table?",
      "answer": "The grain: what event each row represents."
    }
  },
  "m07-l5": {
    "summary": "A data contract unites schema, semantics, quality, SLA and ownership.",
    "explanation": [
      "Uniqueness, completeness, validity and freshness checks must have threshold and action, not just a boolean query.",
      "SLOs allow you to detect degradation and decide whether to block publishing. The contract is versioned when the consumer's expectation changes."
    ],
    "deepDive": {
      "mentalModel": "A data contract brings together what producer and consumers can assume: schema, meaning, grain, keys, quality, freshness, retention, ownership and change policy. A DDL captures only a part. The contract must be verifiable through testing and observability, and every breach needs action and accountability. Compatible evolution is judged from consumers: adding a nullable column may be syntactically safe, but break SELECT * or rigid serialization. Versioning contracts does not mean always duplicating tables; It involves communicating, testing and controlling the transition. Without ownership, an alert only describes a problem. Without measured SLA, the promise of fresh data is not operable.",
      "mechanics": [
        "The producer publishes schema and semantics along with rules such as uniqueness, dominance, null ratio, and reconciliation. The pipeline evaluates these rules per batch or window and records metrics. Unity Catalog provides comments, tags, lineage and privileges; expectations and tests provide process controls. Consumers validate compatibility in CI or a test environment. Each critical field indicates unit, time zone, and treatment of unknowns.",
        "The change process classifies addition, deprecation or rupture. A new column is announced and tested; a rename may require coexistence; A grain change usually requires a new version of the product. The owner approves exceptions and defines the migration period. During operation, freshness and quality are observed together: a table updated on time with 30% nulls does not fulfill the complete contract."
      ],
      "concepts": [
        {
          "term": "Data contract",
          "definition": "Verifiable agreement on the structure, semantics, operation and evolution of a data product.",
          "whyItMatters": "Reduces implicit interpretations and coordinates changes between teams."
        },
        {
          "term": "Compatible change",
          "definition": "Modification that supported consumers can adopt without altering their expected behavior.",
          "whyItMatters": "It must be demonstrated with evidence, not assumed because it is additive."
        },
        {
          "term": "Ownership",
          "definition": "Explicit responsibility to decide, operate and respond for a dataset or contract.",
          "whyItMatters": "Turn alerts and change requests into authoritative actions."
        }
      ],
      "workedScenario": {
        "situation": "The producer wants to rename net_sales and change euros for cents without notifying twelve dashboards.",
        "reasoning": [
          "Classify the change of name and unit as a semantic break even though the type remains numerical.",
          "Temporarily publish a new column or version with documented unit and equivalence testing.",
          "Agree on migration with consumers, observe usage and remove the old field only after the defined period."
        ],
        "outcome": "The evolution avoids figures a thousand times higher and leaves an auditable transition with those responsible and a withdrawal date."
      }
    },
    "keyPoints": [
      "Each rule has a threshold",
      "SLO measures service",
      "Ownership enables response"
    ],
    "decisions": [
      "Each rule has a threshold",
      "SLO measures service",
      "Ownership enables response"
    ],
    "example": {
      "title": "Completeness Metric",
      "note": "Compare with a threshold, for example 0.995, and record the decision."
    },
    "pitfalls": [
      "Check without action",
      "Ownerless SLA"
    ],
    "examDecision": "Choose a ruler that measures the requirement and a proportional action; don't turn every failure into DROP.",
    "checkpoint": {
      "question": "What differentiates a check from an operating contract?",
      "answer": "The contract adds threshold, action, owner and temporal expectation."
    }
  },
  "m08-l1": {
    "summary": "The intake is chosen by origin, volume, freshness, changes and government.",
    "explanation": [
      "Full loading simplifies small fonts; Incremental reduces motion but requires cursor, discovered files or CDC.",
      "Before selecting the tool, define retry, deletions, scheme and responsibility limit."
    ],
    "deepDive": {
      "mentalModel": "Selecting ingestion means translating source properties into target guarantees. A finite set of files can be uploaded in batch; an increasing path needs incremental discovery; an operational basis may require snapshot, JDBC or CDC queries; an API requires pagination and boundary checking. Volume, speed, scheme, order, deletions, authentication, replay and SLA determine the tool. COPY INTO, Auto Loader and Lakeflow Connect are not synonyms for small, medium and large: they offer different status and operation models. The self-sustaining decision first identifies what constitutes new data and how it is demonstrated that it was not lost or processed twice.",
      "mechanics": [
        "Batch ingestion enumerates a bounded entry and publishes a commit. Incremental maintains state about files, offsets or changes to continue from a point. A mutable source forces you to decide whether to extract current state or change events. The Bronze target retains enough metadata to reconcile: batch ID, file, offset, extraction time, and schema version. Unity Catalog governs routes, connections, and tables to avoid embedded credentials.",
        "The SLA includes latency and recovery. Frequent polling can create empty runs; notifications or connectors reduce that burden. A managed connector simplifies operation if it supports the necessary font and semantics; Custom code provides control with greater responsibility. Before production, backfill, duplication, deletion and drop between read and commit are tested. The choice is documented with a discarded alternative and its observable trade-off."
      ],
      "concepts": [
        {
          "term": "incremental unit",
          "definition": "Element whose identity allows progress to be recognized, such as file, offset or change version.",
          "whyItMatters": "Defines how to resume and avoid accidental reprocessing."
        },
        {
          "term": "Replay",
          "definition": "Ability to reprocess a durable input from a known point.",
          "whyItMatters": "It is essential to correct logic without depending on the availability of the source."
        },
        {
          "term": "CDC",
          "definition": "Capture of insertions, updates, and deletions from a source with associated order or sequence.",
          "whyItMatters": "Preserves changes that a periodic snapshot might miss."
        }
      ],
      "workedScenario": {
        "situation": "One base updates orders every minute, removes canceled ones, and only allows a nightly window for full statements.",
        "reasoning": [
          "Recognize that daily snapshots can lose intermediate states and that deletions need explicit representation.",
          "Evaluate a supported managed or log-based CDC connector, with durable Bronze sequencing and destination.",
          "Design initial snapshot, resumption, reconciliation and treatment of deletes before setting the SLA."
        ],
        "outcome": "The ingest preserves every relevant change and can be resumed without repeating entire extracts or ignoring deletions."
      }
    },
    "keyPoints": [
      "Full and incremental have trade-offs",
      "Idempotence is a requirement",
      "The origin conditions the pattern"
    ],
    "decisions": [
      "Full and incremental have trade-offs",
      "Idempotence is a requirement",
      "The origin conditions the pattern"
    ],
    "example": {
      "title": "Ingestion contract",
      "note": "The cursor must be stable and support tie-breaks."
    },
    "pitfalls": [
      "Reliable cursorless incremental",
      "Full load that deletes useful history"
    ],
    "examDecision": "Recurring files: COPY INTO or Auto Loader; Supported enterprise connector: Lakeflow Connect; Specific API: Orchestrated REST.",
    "checkpoint": {
      "question": "What requires an incremental load from API?",
      "answer": "Stable cursor or token, idempotent retry and deletion policy."
    }
  },
  "m08-l2": {
    "summary": "Format and compression affect schema, pushdown, size and cost.",
    "explanation": [
      "Parquet and Delta are columnar; JSON/CSV require parsing and contracts; XML, text and binary cover non-tabular sources.",
      "Bronze can preserve payload and metadata, but must fix encoding, delimiter, and handling of corrupt records."
    ],
    "deepDive": {
      "mentalModel": "The format determines what structural information the engine can use before reading each value. CSV is text without embedded types and requires delimiter, escape, locale and external schema. JSON preserves hierarchy, but its verbosity and variability complicate massive analysis. Parquet is columnar, typed and compressed; allows pruning of columns and pushdown of filters based on metadata. Delta uses Parquet for data and adds transaction log, versions and DML. Compression reduces bytes at the cost of CPU with different algorithms. Choosing is not just about comparing size: interoperability, evolution, reading patterns, quality and need for transactions are assessed.",
      "mechanics": [
        "A CSV reader must tokenize each record and convert text according to schema; inferSchema adds reading and can produce unstable types between batches. JSON requires a schema to stabilize structs and arrays. Parquet stores columns in groups with statistics and codecs, so a query can avoid irrelevant columns and, in some cases, groups. However, thousands of small files add metadata and overhead even if the format is columnar.",
        "Delta logs active Parquet files and metadata in commits, enabling enforcement, MERGE and history. It doesn't automatically turn a bad model into an efficient one: layout, sizes and filters still matter. For exchange, the source format can be preserved in the landing and normalized to Delta Bronze. The choice of codec is tested with write time, read time and ratio; a smaller file is not better if it violates processing latency."
      ],
      "concepts": [
        {
          "term": "Columnar format",
          "definition": "Physical organization that stores values of the same column together and preserves metadata by groups.",
          "whyItMatters": "It favors pruning, compression and column subset analysis."
        },
        {
          "term": "Predicate pushdown",
          "definition": "Application of filters in the reader to avoid materializing data that cannot comply with them.",
          "whyItMatters": "Reduces I/O when format and expression allow it."
        },
        {
          "term": "Codec",
          "definition": "Algorithm that compresses and decompresses blocks of data with size and CPU trade-offs.",
          "whyItMatters": "It affects storage, network and processing time costs."
        }
      ],
      "workedScenario": {
        "situation": "A provider delivers 2 TB CSVs daily and each batch infers amounts differently from empty values.",
        "reasoning": [
          "Reject inference as a contract and declare schema, locale, delimiter and corrupt record policy.",
          "Keep original file on landing and convert once to Delta Bronze with source metadata.",
          "Compare size and time of representative queries, verifying types and counts after conversion."
        ],
        "outcome": "The platform stabilizes the schema and avoids rereading costly text, without losing the evidence provided by the provider."
      }
    },
    "keyPoints": [
      "Parquet is columnar",
      "Delta adds transactions",
      "Semi-structured requires schema"
    ],
    "decisions": [
      "Parquet is columnar",
      "Delta adds transactions",
      "Semi-structured requires schema"
    ],
    "example": {
      "title": "Reading with outline",
      "note": "Measures the corrupt records column if you configure it."
    },
    "pitfalls": [
      "Infer CSV in each run",
      "Confusing Parquet with Delta"
    ],
    "examDecision": "Delta is transactional table; Parquet is file format without transaction log.",
    "checkpoint": {
      "question": "What does Delta add to Parquet?",
      "answer": "A protocol and transaction log with ACID and table management."
    }
  },
  "m08-l3": {
    "summary": "COPY INTO loads new files from object storage in a retryable manner.",
    "explanation": [
      "Maintains history of already processed files to avoid reloading in normal runs and allows limited formatting and transformation options.",
      "It is appropriate for simple incremental SQL ingestion; Auto Loader scales best for continuous discovery and advanced evolution."
    ],
    "deepDive": {
      "mentalModel": "COPY INTO is an incremental SQL file load that records which entries were processed for a table and allows re-execution without normally loading the same files. It is appropriate for single or periodic batches from object storage when Auto Loader streaming control is not needed. Idempotency is based on file identity and loading state, not the business key; If the producer publishes the same content under another name, you can enter again. FILEFORMAT, FORMAT_OPTIONS and COPY_OPTIONS separate how to read from how to load. Validation, schema, and errors must be consciously configured before converting COPY INTO to a promise of exactly one row per event.",
      "mechanics": [
        "The statement resolves a governed path, lists candidate files, and compares their identity to the load history maintained for the table. New ones are read with the declared format and options and committed to Delta. A failure before commit can be retried; a subsequent run skips already registered files except for explicit options. Patterns and validation allow for narrowing, but changing routes or supplier overwrites require an additional contract.",
        "COPY INTO does not maintain a Structured Streaming checkpoint or discover with the same optimizations at Auto Loader scale. It's easy to schedule in Jobs and audit using history and queue metrics. For security, a Volume or external location is used, not keys in the statement. It is tested with first run, second run, a new file, a malformed file and a renamed copy to understand the actual idempotency limits."
      ],
      "concepts": [
        {
          "term": "COPY INTO",
          "definition": "SQL command that loads new files into a table and maintains status of processed files.",
          "whyItMatters": "Provides a simple, retryable batch path for object storage."
        },
        {
          "term": "FILEFORMAT",
          "definition": "Declaration of the source format that the reader selects for the files.",
          "whyItMatters": "It must correspond to the physical representation and does not replace parsing options."
        },
        {
          "term": "File identity",
          "definition": "Metadata used to distinguish already processed entries from new candidates.",
          "whyItMatters": "Clarifies why renaming content can cause a reload."
        }
      ],
      "workedScenario": {
        "situation": "Twenty immutable Parquets arrive every hour; The volume is moderate and the team only operates batch SQL.",
        "reasoning": [
          "Confirm that the source is append-only, the names are stable, and one hour meets the required freshness.",
          "Use COPY INTO from a governed location and schedule it as a Job with explicit schema and metrics.",
          "Run the same batch twice and add a new file to demonstrate status and idempotency per file."
        ],
        "outcome": "The solution meets the SLA with minimal operation and makes it clear that business duplicates require separate controls."
      }
    },
    "keyPoints": [
      "Track files",
      "It is declarative SQL",
      "Does not replace CDC rows"
    ],
    "decisions": [
      "Track files",
      "It is declarative SQL",
      "Does not replace CDC rows"
    ],
    "example": {
      "title": "COPY INTO governed",
      "note": "Pre-create the table with explicit schema."
    },
    "pitfalls": [
      "Rename content and wait for row deduplication",
      "Using force without understanding reload"
    ],
    "examDecision": "For recurring files and simple SQL, COPY INTO; for high scale and streaming, Auto Loader.",
    "checkpoint": {
      "question": "Does COPY INTO dedupe by order_id?",
      "answer": "No; avoids reprocessing registered files, not business entities."
    }
  },
  "m08-l4": {
    "summary": "JDBC/ODBC query tabular systems; REST requires pagination, limits, and durable persistence.",
    "explanation": [
      "A parallel JDBC read needs consistent partitionColumn and bounds; too many connections can damage the origin.",
      "A REST API must handle rate limits, retries with backoff, tokens, pagination and checkpoints before publishing to UC."
    ],
    "deepDive": {
      "mentalModel": "JDBC and ODBC present a tabular query model; REST presents paginated resources and responses under an HTTP contract. In JDBC, the read partition determines parallelism and can overload the database if too many connections are chosen. Predicates and columns should be pushed when possible. In REST, every page, cursor, rate limit, retry, and partial error is part of the state. No interface should be used as an invisible buffer: responses are durably persisted before or along with their transformation. Authentication is resolved using secrets or governed connections, and logs should never expose tokens or sensitive data.",
      "mechanics": [
        "spark.read.jdbc can split a range using partitionColumn, lowerBound, upperBound, and numPartitions, creating concurrent queries. The limits do not necessarily filter the whole; They determine the partition stride, so the query must include its own incremental condition. An unevenly distributed column produces skew. Isolation and the database read window determine whether partitions observe a consistent snapshot.",
        "A REST extraction iterates next token or links until complete, respects Retry-After, and distinguishes recoverable errors from invalid ones. The checkpoint saves the cursor and confirmed batch only after the page is persisted, so as not to skip data after a failure. Original responses can be stored in landing with request id, timestamp and hash. The paging logic is tested with empty page, last page, 429 and repeated response."
      ],
      "concepts": [
        {
          "term": "Pushdown",
          "definition": "Running projections or filters on the source system instead of transferring all data.",
          "whyItMatters": "Reduces network and Spark load, although it must be verified in the plan."
        },
        {
          "term": "Cursor",
          "definition": "Opaque token issued by an API to continue a paged sequence from a position.",
          "whyItMatters": "You must persist with the confirmed batch to resume without gaps."
        },
        {
          "term": "Rate limit",
          "definition": "Service policy that restricts requests to a window and communicates how to retry.",
          "whyItMatters": "It forces backoff and throughput to be designed without causing blockages."
        }
      ],
      "workedScenario": {
        "situation": "An API returns one hundred items per page, limits to ten requests per second, and fails after the 800th page.",
        "reasoning": [
          "Persist each page with input cursor, request id and hash before advancing confirmed progress.",
          "Apply backoff with jitter for 429 and retry from the last committed cursor, not from the beginning without deduplication.",
          "Reconcile items and pages, controlling repeated responses using a stable API key."
        ],
        "outcome": "Extraction resumes without gaps or request storms and preserves evidence to reproduce the batch."
      }
    },
    "keyPoints": [
      "Protect the source system",
      "Persistence before transform",
      "Credentials outside the code"
    ],
    "decisions": [
      "Protect the source system",
      "Persistence before transform",
      "Credentials outside the code"
    ],
    "example": {
      "title": "Partitioned JDBC",
      "note": "Bounds divide reading, they do not filter rows."
    },
    "pitfalls": [
      "Open hundreds of connections",
      "Logging REST tokens"
    ],
    "examDecision": "Parallelizes JDBC only if the source tolerates connections and suitable partition column exists.",
    "checkpoint": {
      "question": "Do numPartitions in JDBC also limit connections?",
      "answer": "Yes, it limits the maximum number of concurrent partitions/connections."
    }
  },
  "m08-l5": {
    "summary": "A governed landing preserves origin, batch and evidence for replay.",
    "explanation": [
      "Volumes offer file paths under Unity Catalog; Bronze tables organize records with ingestion metadata.",
      "Idempotence is demonstrated by repeating the same batch and comparing rows, keys and commits, not just absence of error."
    ],
    "deepDive": {
      "mentalModel": "Landing is a durable boundary between reception and processing. It retains the delivered bytes, object identity, time, producer, batch and, when applicable, checksum or transport metadata. It is not an anonymous dump nor necessarily a table for analysts. Its purpose is to demonstrate what arrived and allow replay when the Silver logic changes or a subsequent process fails. Unity Catalog Volumes and external locations govern paths and prevent credentials in code. The folder structure can assist operation, but should not replace a queryable manifest and metadata. Retention, encryption, classification and access are defined by sensitivity and re-extraction capacity.",
      "mechanics": [
        "The receiver writes an immutable object or registers it with stable identity before marking the batch available. A manifest includes name, size, checksum, source timestamp, and state. Ingesting to Bronze adds _metadata.file_path and times to relate rows to files. If the producer overwrites names, a landing zone must version or rename in a controlled manner; otherwise, the replay does not exactly reconstruct the original input.",
        "Access is granted to ingestion and operation principals, not all consumers. Withholding balances regulation, cost and the possibility of recovering from source. A cleanup process only removes data when subsequent commits and replay requirements allow it. Invalid files are preserved with status and reason, without automatically being shuffled again. Manifest metrics are compared to Bronze rows to detect loss or partial read."
      ],
      "concepts": [
        {
          "term": "Landing zone",
          "definition": "Governed area where the received representation is preserved before irreversible transformations.",
          "whyItMatters": "Decouples source availability and allows verifiable replay."
        },
        {
          "term": "Manifesto",
          "definition": "Record of expected and observed objects with size, checksum, batch and status.",
          "whyItMatters": "Allows you to reconcile transfers and detect missing or altered files."
        },
        {
          "term": "Provenance",
          "definition": "Information that relates a data with producer, object, instant and process of origin.",
          "whyItMatters": "Supports auditing and error location throughout the pipeline."
        }
      ],
      "workedScenario": {
        "situation": "A supplier overwrites orders.csv every night and sometimes fixes the file two hours later without warning.",
        "reasoning": [
          "Copy each receipt to an immutable route with timestamp and checksum before processing.",
          "Register both versions in the manifest and associate Bronze rows with the exact version using metadata.",
          "Define with business if the correction replaces the batch and execute idempotent replay with evidence of differences."
        ],
        "outcome": "The platform can explain and reproduce each version received, even when the external name does not change."
      }
    },
    "keyPoints": [
      "Volumes govern files",
      "Bronze preserves metadata",
      "Replay should be tested"
    ],
    "decisions": [
      "Volumes govern files",
      "Bronze preserves metadata",
      "Replay should be tested"
    ],
    "example": {
      "title": "Source metadata",
      "note": "Persists the metadata necessary to investigate duplicates."
    },
    "pitfalls": [
      "Save landing in personal route",
      "Declare idempotency without second run"
    ],
    "examDecision": "For governed non-tabular files, use Volumes; for relational consumption, publishes UC tables.",
    "checkpoint": {
      "question": "What evidence proves safe retry?",
      "answer": "Same logical result after running the same batch twice."
    }
  },
  "m09-l1": {
    "summary": "Auto Loader discovers files incrementally using cloudFiles.",
    "explanation": [
      "readStream.format('cloudFiles') preserves file state and scales without listing everything repeatedly.",
      "It needs source format, durable checkpoint and, depending on the case, schemaLocation or provided schema."
    ],
    "deepDive": {
      "mentalModel": "Auto Loader is an incremental Structured Streaming source called cloudFiles that transforms a growing directory into a stateful stream of discovered and processed files. It does not observe new rows within a mutable file or automatically convert business duplicates into unique events. Its progress unit is the file identified during discovery. A checkpoint maintains streaming progress and the schema location maintains the history used for inference and evolution; They fulfill different functions and both belong to a single logical load. Auto Loader can run directly with Structured Streaming or within Spark Declarative Pipelines, the current framework that underpins the managed Lakeflow pipelines offering, a name still visible in previous materials.",
      "mechanics": [
        "The reader uses cloudFiles format and cloudFiles.format to interpret underlying files. During each trigger it discovers new candidates, checks their status and plans a microbatch. The query transforms this data and a transactional sink confirms the batch along with the progress of the checkpoint according to the engine's guarantees. The availableNow mode processes the available and terminates; a continuous trigger keeps the query active. The choice depends on the SLA and operational cost, it does not change the incremental nature of the source.",
        "Schema inference samples files and persists the result in schemaLocation. With schema evolution, a new column can stop, rescue or extend the schema depending on configuration; behavior must be tested and monitored. rescuedDataColumn retains mismatched fields, but does not replace a Silver contract. Each pipeline and environment uses unique checkpoint and schema paths: sharing them mixes up progress, prevents independent backfills, and can lead one application to believe it has processed files that belonged to another."
      ],
      "concepts": [
        {
          "term": "cloudFiles",
          "definition": "Name of the Auto Loader Structured Streaming source that discovers and incrementally processes files in cloud storage.",
          "whyItMatters": "Distinguishes the discovery mechanism from the actual format, such as JSON, CSV, or Parquet, contained in each file."
        },
        {
          "term": "Checkpoint",
          "definition": "Durable directory that preserves offsets, commits, and state necessary to resume an identifiable streaming query.",
          "whyItMatters": "It allows you to continue after a failure without forgetting the progress confirmed by that specific logical load."
        },
        {
          "term": "Schema location",
          "definition": "Durable location where Auto Loader records the inferred schema and its evolution across successive batches.",
          "whyItMatters": "Separates the structural contract history from the progress data saved at the checkpoint."
        }
      ],
      "workedScenario": {
        "situation": "A platform receives tens of thousands of JSON per hour in an S3 path, requires results every fifteen minutes, and must recover after reboots without rereading for six full months.",
        "reasoning": [
          "Select Auto Loader because the source is a growing append-only directory and the verifiable incremental unit is each discovered file.",
          "Configure cloudFiles, explicit or controlled schema, schemaLocation and unique checkpoint, using scheduled availableNow if it satisfies the fifteen minutes.",
          "Test first batch, restart and new column, reconciling files and rows before declaring recovery and evolution complete."
        ],
        "outcome": "Ingest resumes from durable state, limits work to new files, and makes any schema changes visible before contaminating Silver."
      }
    },
    "keyPoints": [
      "cloudFiles is the source",
      "Checkpoint preserves progress",
      "Scheme must be governed"
    ],
    "decisions": [
      "cloudFiles is the source",
      "Checkpoint preserves progress",
      "Scheme must be governed"
    ],
    "example": {
      "title": "Auto Loader",
      "note": "Use different schema and checkpoint routes per workload."
    },
    "pitfalls": [
      "Share checkpoint",
      "Delete it to retry"
    ],
    "examDecision": "For growing files at scale and incremental processing, Auto Loader is the direct choice.",
    "checkpoint": {
      "question": "Which option indicates file format?",
      "answer": "cloudFiles.format."
    }
  },
  "m09-l2": {
    "summary": "Directory listing simplifies; file notification reduces listings on a large scale.",
    "explanation": [
      "Discovery mode is chosen by volume and cloud configuration; both need correct permissions.",
      "rescuedDataColumn preserves mismatched fields and allows evolution to be studied without losing payload."
    ],
    "deepDive": {
      "mentalModel": "Directory listing and file notification are strategies for finding files, not input formats or final delivery guarantees. The listing queries the object storage hierarchy and compares results with state; It is simple and works without event infrastructure, but its enumeration cost grows with huge routes. Notifications leverage cloud events and queues to flag new objects, reducing lists at scale, in exchange for additional permissions and components. Auto Loader manages file status in both cases. The choice depends on the total number of objects, arrival rate, SLA, network restrictions and operational capacity. A notification event is not a substitute for object validation or sink commit.",
      "mechanics": [
        "In listing, discovery obtains object metadata and Auto Loader filters those that have already been processed. Organizing prefixes and avoiding mixed backfills can reduce work, although routes should still be reproducible. The cloud service can offer consistent listings with its own characteristics, but the pipeline must treat the file identity and checkpoint status as processing authority. Frequent listing of millions of objects can dominate cost and latency.",
        "In notification mode, creation events arrive to a queue or managed service. Databricks obtains candidates and verifies files before reading them; Duplicate or out-of-order events are normal in messaging architectures and state prevents processing them out of control. In modern configurations there may be file events managed through external locations. Permissions need to cover events and storage, and the runbook needs to explain delays, objects deleted before reading, and recovering from a broken queue."
      ],
      "concepts": [
        {
          "term": "Directory listing",
          "definition": "Discovery that enumerates objects under a path and compares their metadata with the previously preserved incremental state.",
          "whyItMatters": "It offers less initial complexity, but can become the dominant cost when the hierarchy accumulates millions of files."
        },
        {
          "term": "File notification",
          "definition": "Discovery based on cloud events that announce the creation of objects through a queue or equivalent service.",
          "whyItMatters": "It reduces massive enumerations, although it adds identity configuration, events and operation of the associated infrastructure."
        },
        {
          "term": "file event",
          "definition": "Potentially duplicate or out-of-order signal that identifies a candidate object, not a confirmation of complete processing.",
          "whyItMatters": "It forces you to preserve state and verify the file before considering that the data arrived correctly at the destination."
        }
      ],
      "workedScenario": {
        "situation": "A landing page contains one hundred and fifty million historical objects and receives two million a day; The listing of each trigger takes longer than the transformation and threatens the SLA.",
        "reasoning": [
          "Separate discovery and process time using metrics, confirming that the accumulated enumeration is the neck and not the parsing.",
          "Evaluate managed file notification or file events with minimal permissions, queue retention, and properly governed external path.",
          "Run both modes on a representative window and check latency, cost, event duplicates and reconciliation of processed files."
        ],
        "outcome": "The event-driven strategy reduces enumeration work without confusing a notification with a successful commit or losing recoverability."
      }
    },
    "keyPoints": [
      "Listing requires less infrastructure",
      "Notifications escalate discovery",
      "Rescued data preserves anomalies"
    ],
    "decisions": [
      "Listing requires less infrastructure",
      "Notifications escalate discovery",
      "Rescued data preserves anomalies"
    ],
    "example": {
      "title": "Rescue changes",
      "note": "Alert if _rescued_data grows."
    },
    "pitfalls": [
      "Ignore rescued data",
      "Change schema without testing checkpoint"
    ],
    "examDecision": "If unexpected fields appear, rescue them and evaluate evolution before discarding them.",
    "checkpoint": {
      "question": "What is _rescued_data for?",
      "answer": "To persist data that does not match the expected schema."
    }
  },
  "m09-l3": {
    "summary": "Lakeflow Connect managed connectors manage ingestion; Standard connectors offer access from code.",
    "explanation": [
      "Managed connectors reduce operation and create governed pipelines for compatible sources. Standard connectors extend sources from Spark or pipelines.",
      "CDC availability, latency, and capabilities are connector-dependent; not all offer the same semantics."
    ],
    "deepDive": {
      "mentalModel": "Lakeflow Connect organizes ingestion options from highly managed connectors to more customizable interfaces. Managed connectors encapsulate authentication, incremental read, serverless compute, and governed destination for supported sources. Standard connectors expose capabilities from SQL, Python, or streaming APIs when you need to control transformations, options, or sources. Current documentation recommends starting with the most managed layer that meets requirements and moving down only for a specific limitation. The transformations framework is called Spark Declarative Pipelines; Lakeflow pipelines is the managed offering that extends it and still appears as a short name in the blueprint and legacy material. No connector eliminates the need to validate CDC and SLA semantics.",
      "mechanics": [
        "A managed connector typically defines a Unity Catalog Connection, an ingestion pipeline, and a destination streaming tables. The Connection protects authentication details and is a securable; The pipeline reads snapshots or changes depending on the connector and runs serverless by default when available. The team operates configuration, scheduling, object selection and observability, without implementing low-level logic. Functionalities and availability states vary by source and cloud, so they should be checked before committing to the design.",
        "A standard connector allows you to use Auto Loader, Kafka, JDBC or other sources from Structured Streaming or Spark Declarative Pipelines, with greater control over options and code. This control transfers responsibility for checkpoints, evolution, retries, compatibility and performance. A managed connector also does not guarantee that the target model correctly represents deletes, sequence, or keys; Initial snapshot, changes and counts are reconciled with the source. The decision records which requirement was not covered by the most managed layer."
      ],
      "concepts": [
        {
          "term": "Managed connector",
          "definition": "Configured integration that manages incremental read, compute, and governed publishing for an explicitly supported enterprise source.",
          "whyItMatters": "It reduces code and operation when its capabilities, region, and semantics match actual ingestion requirements."
        },
        {
          "term": "standard connector",
          "definition": "Ingestion interface available from code or SQL that grants greater control over pipeline options and behavior.",
          "whyItMatters": "It allows you to cover special sources or requirements, but makes the team responsible for status, testing and recovery."
        },
        {
          "term": "Connection",
          "definition": "Unity Catalog Securable that represents managed connectivity and authentication to an external data system.",
          "whyItMatters": "Avoids distributing credentials between notebooks and allows the use of external access to be granted through centralized governance."
        }
      ],
      "workedScenario": {
        "situation": "The company needs to replicate Salesforce, a supported source, with standard object selection and without complex prior transformations; only three people operate the platform.",
        "reasoning": [
          "Verify regional availability, supported objects, frequency, authentication and incremental treatment of the current Salesforce managed connector.",
          "Choose the managed option and a governed Connection because no stated need justifies implementing a custom reader.",
          "Test initial snapshot, change, delete and recovery; Reconcile target tables before transferring the operation to the small team."
        ],
        "outcome": "Ingestion reduces code footprint and credentials by maintaining explicit proof of completeness, evolution, and semantics of published changes."
      }
    },
    "keyPoints": [
      "Managed minimizes operation",
      "Standard gives control in code",
      "Capacities depend on source"
    ],
    "decisions": [
      "Managed minimizes operation",
      "Standard gives control in code",
      "Capacities depend on source"
    ],
    "example": {
      "title": "Connector evaluation",
      "note": "Confirm regional support and source objects."
    },
    "pitfalls": [
      "Promise CDC without verifying connector",
      "Choose custom before checking managed"
    ],
    "examDecision": "Supported enterprise source and low operation: managed connector; special logic: standard/custom.",
    "checkpoint": {
      "question": "What core advantage does managed offer?",
      "answer": "Databricks manages supported ingestion infrastructure and operation."
    }
  },
  "m09-l4": {
    "summary": "The decision matrix compares volume, frequency, types and governance.",
    "explanation": [
      "COPY INTO fits into batches of simple files; Auto Loader on scalable incremental files; Connect on SaaS and supported bases.",
      "JDBC/REST are still valid when the source or contract is not covered, but they shift more responsibility to the team."
    ],
    "deepDive": {
      "mentalModel": "An ingestion matrix forces you to compare solutions on the same set of requirements rather than choosing based on familiarity. The rows represent sources or cases; The columns capture volume, frequency, latency, mutability, deletes, schema, authentication, replay, backfill, regional availability, cost and operation. Each option is scored with evidence and a condition that would invalidate the decision is documented. COPY INTO can win for simple batch SQL; Auto Loader for growing files; a managed connector for a supported application; CDC for base changes; Custom REST for an API without integration. The matrix does not replace a test: it identifies which hypothesis the laboratory must validate.",
      "mechanics": [
        "The volume includes both bytes and number of objects, because millions of small files behave differently than a few large ones. Frequency distinguishes a temporary obligation from a data signal. Mutability asks whether records are updated or deleted. Government covers where credentials live, how the route is limited and who executes. Recovery requires defining incremental unit, checkpoint, backfill and reconciliation. An option incapable of representing deletes is discarded even if its throughput is excellent.",
        "After filtering out incompatibilities, a benchmark is performed with representative data and failures. End-to-end latency, load on the source, computing cost, operational intervention and accuracy are measured. The matrix records date and official links because capabilities change. Choosing the most managed layer reduces work only if it fulfills the contract; Unnecessary customization creates debt, while insufficient abstraction can hide a critical limitation."
      ],
      "concepts": [
        {
          "term": "Elimination criterion",
          "definition": "Mandatory requirement whose absence rules out an alternative before comparing secondary advantages such as comfort or price.",
          "whyItMatters": "Avoid selecting a popular tool that cannot represent the indispensable semantics of the source."
        },
        {
          "term": "Representative Benchmark",
          "definition": "Test with distribution, scale, concurrency and failures similar to the expected operation, accompanied by reproducible metrics.",
          "whyItMatters": "It turns the architectural decision into evidence and reveals limits that a theoretical table does not show."
        },
        {
          "term": "Operational load",
          "definition": "Time, knowledge, and human actions required to configure, monitor, repair, and evolve an ingestion solution.",
          "whyItMatters": "It is part of the total cost and favors managed services when they satisfy the technical contract."
        }
      ],
      "workedScenario": {
        "situation": "A committee compares COPY INTO, Auto Loader and its own connector for 500 files per day, but has not documented whether there are corrections, deletes or backfills.",
        "reasoning": [
          "Stop scoring and complete mutability, file identity, SLA, schema, recheck, and authentication restrictions first.",
          "Discard incompatible options and build a test with a second run, corrected file, intermediate failure and controlled backfill.",
          "Compare accuracy, latency and operation, recording why the chosen alternative is still valid for the expected volume."
        ],
        "outcome": "The decision is tied to verifiable requirements and can be reviewed when the source changes, rather than becoming an irreversible preference."
      }
    },
    "keyPoints": [
      "There is no universal tool",
      "Government is part of the election",
      "Operation is a cost"
    ],
    "decisions": [
      "There is no universal tool",
      "Government is part of the election",
      "Operation is a cost"
    ],
    "example": {
      "title": "Readable ruler",
      "note": "Complete with SLA, CDC and limitations."
    },
    "pitfalls": [
      "Use streaming for a monthly batch",
      "Build REST for already supported source"
    ],
    "examDecision": "Prioritize the managed option that meets the requirements; increases control only with a specific cause.",
    "checkpoint": {
      "question": "What to choose for continuous JSON in S3/ADLS/GCS?",
      "answer": "Auto Loader, with governed checkpoint and scheme."
    }
  },
  "m09-l5": {
    "summary": "Evolution and state must be isolated by pipeline and environment.",
    "explanation": [
      "Checkpoint encodes offsets and state compatible with the query; source, key or state changes may require new location and backfill.",
      "Dev and prod do not share schemaLocation or checkpoint. The target table is governed in UC and the identity is least privileged."
    ],
    "deepDive": {
      "mentalModel": "The checkpoint and schema location are part of the identity of a pipeline, just like its code and destination. Dev, test, prod, backfill and new logic should not accidentally share them. The checkpoint states which units were confirmed and may contain operator status; Reusing it with another query may skip data, reject incompatible changes, or mix semantics. The schema location preserves inferred evolution and must also correspond to a source and contract. To reprocess, a new identity and an idempotent destination or strategy are created; deleting a production checkpoint is not a retry button. Routes are named, governed and retained with the same discipline as a table.",
      "mechanics": [
        "Structured Streaming associates the checkpoint with the topology of sources, stateful operators and sink. Some query changes are supported and some are not; Engine documentation should be consulted before deploying over existing state. Auto Loader logs discovered and processed files, while sink transactions avoid publishing partial batches. Copying the checkpoint from prod to dev can expose metadata and cause dev to skip the entire history, even if it points to another table.",
        "A backfill is executed with an exclusive checkpoint and a limited range or route. Their results are written in staging or integrated using deterministic MERGE so as not to compete with streaming. The schema evolution is tested against a controlled copy of the contract and then promoted. The runbook preserves location, owner, source, destination and recovery procedure; cleanup requires verifying that no active runs or audits depend on the state."
      ],
      "concepts": [
        {
          "term": "Pipeline identity",
          "definition": "Stable set of source, transformation, destination, and durable state that defines a concrete incremental load.",
          "whyItMatters": "It prevents treating checkpoints as interchangeable files between environments or logic with different meanings."
        },
        {
          "term": "Operator status",
          "definition": "Persistent intermediate data for windows, aggregations, deduplication, or other operations that depend on previous events.",
          "whyItMatters": "Causes certain code changes to be incompatible with an existing checkpoint and require planned migration."
        },
        {
          "term": "Isolated backfill",
          "definition": "Historical reprocessing with its own state and scope that integrates results through controlled and idempotent writing.",
          "whyItMatters": "Avoid disrupting production progress or duplicating data while regular ingestion continues."
        }
      ],
      "workedScenario": {
        "situation": "An engineer copies the production checkpoint to test to save time; the test ends without reading any files and is mistakenly considered successful.",
        "reasoning": [
          "Recognize that the legacy state marks files as processed and that an empty run does not validate the new logic.",
          "Create test-exclusive checkpoint, schema location and destination, loading a known set with representative schema changes.",
          "Verify expected files, rows, status and second run before authorizing promotion on the compatible production checkpoint."
        ],
        "outcome": "The test actually performs ingestion and maintains isolation, while production maintains its durable progress and an explicit migration path."
      }
    },
    "keyPoints": [
      "Checkpoint is part of the contract",
      "Isolated environments",
      "Backfill is planned"
    ],
    "decisions": [
      "Checkpoint is part of the contract",
      "Isolated environments",
      "Backfill is planned"
    ],
    "example": {
      "title": "Durable writing",
      "note": "availableNow processes what is available and stops, preserving progress."
    },
    "pitfalls": [
      "Reuse checkpoint with another query",
      "Save checkpoint to temporary route"
    ],
    "examDecision": "For incremental batch execution with durable state, it combines Auto Loader, availableNow and stable checkpoint.",
    "checkpoint": {
      "question": "What happens when you delete a checkpoint?",
      "answer": "Progress is lost; The source may be reprocessed or become incompatible depending on configuration."
    }
  },
  "m10-l1": {
    "summary": "Lakeflow Jobs expresses workflows as DAGs of tasks with observable dependencies.",
    "explanation": [
      "Each task defines type, compute, identity and result; Dependencies allow parallelism when there is no data relationship.",
      "Divide by retryable and idempotent units, not by each line of code."
    ],
    "deepDive": {
      "mentalModel": "Lakeflow Jobs models a workflow as an acyclic directed graph of tasks. Each node has type, compute, parameters, identity, timeout and retry policy; each edge expresses a dependency and execution condition. The DAG does not automatically transport DataFrames or guarantee idempotence: it coordinates units that must publish durable results or small values. Dependencies allow parallelism when there is no causal relationship and block downstream when a precondition fails. A good graph reflects operational boundaries: a task should be able to be retried, observed, and repaired without repeating everything. The name Lakeflow Jobs is the orchestration surface; It should not be confused with Spark Declarative Pipelines, a framework for declaring datasets.",
      "mechanics": [
        "When starting a run, Jobs resolves parameters and schedules tasks whose dependencies are satisfied. Each task runs a notebook, wheel, pipeline, SQL, or other compute-compatible type. Upstream states determine whether downstream runs, ignores, or evaluates a condition. Independent tasks can use separate resources and run in parallel. Sharing classic jobs compute may reduce startup, but couples environment and task cycle; serverless selects managed capacity for supported types.",
        "The graph should persist intermediate data in tables or Volumes governed by run or partition keys where applicable. Observability records job_id, run_id, task_key, intent, input, and metrics. If a task combines ingestion, quality and publication in an indivisible block, a final failure forces repeat work and makes ownership difficult. If it is excessively fragmented, overhead and dependencies grow. The correct frontier matches a verifiable result and a recovery strategy."
      ],
      "concepts": [
        {
          "term": "DAG",
          "definition": "Cycleless directed graph that represents tasks and causal dependencies within an executable workflow.",
          "whyItMatters": "It allows parallelism, fault propagation, and selective recovery to be planned explicitly."
        },
        {
          "term": "Task",
          "definition": "Observable unit of work with its own input, compute, parameters, result and operational policy within a Job.",
          "whyItMatters": "Defines the level at which a part of the process is retried, alerted, measured, and repaired."
        },
        {
          "term": "Dependency",
          "definition": "Relationship that conditions the eligibility of a task to the status or output of another previous task.",
          "whyItMatters": "Avoid executing consumers before their durable and verified preconditions are available."
        }
      ],
      "workedScenario": {
        "situation": "A daily pipeline ingests orders, validates quality, updates two independent Gold products, and notifies upon completion; Today everything lives in a single ninety-minute notebook.",
        "reasoning": [
          "Separate ingestion and validation because they publish verifiable states and quality decides if the products can continue.",
          "Model the two Gold publications as parallel tasks dependent on validation and the notification as a final dependency of both.",
          "Persist governed intermediate exits and test a failure of one branch to demonstrate repair without repeating the other."
        ],
        "outcome": "The DAG reduces the critical path, locates faults and allows only the affected branch to be recovered without losing traceability or duplicating ingestion."
      }
    },
    "keyPoints": [
      "DAG directs order",
      "Independent tasks parallelize",
      "Each task must be retryable"
    ],
    "decisions": [
      "DAG directs order",
      "Independent tasks parallelize",
      "Each task must be retryable"
    ],
    "example": {
      "title": "Minimum DAG",
      "note": "Maps compute and code in the full definition."
    },
    "pitfalls": [
      "Fully serial DAG",
      "Hidden state between notebooks"
    ],
    "examDecision": "Use dependencies only when one task needs the output or success of another.",
    "checkpoint": {
      "question": "What allows you to execute two tasks at the same time?",
      "answer": "That there is no dependency between them and there is available capacity."
    }
  },
  "m10-l2": {
    "summary": "Parameters configure runs and task values exchange small values between tasks.",
    "explanation": [
      "Job parameters can be propagated and task parameters feed notebooks, Python or SQL.",
      "taskValues carries IDs, dates or counts; tables and files carry datasets."
    ],
    "deepDive": {
      "mentalModel": "Parameters configure a run before or when starting tasks; task values ​​communicate small values ​​calculated during the run. None should transport datasets. A date, logical path, threshold, or version identifier fits into the contract; millions of rows belong to a governed table or a Volume. Job parameters centralize shared values ​​and dynamic references provide context such as start time or upstream outputs. A task value has an explicit key, producer, and consumer and is subject to size limits. Converting all values ​​to domain types and validating ranges prevents an empty string from silently changing the processed partition.",
      "mechanics": [
        "Jobs resolves defined parameters and passes them to tasks according to each type. In notebooks they are usually received as strings and must be analyzed. Dynamic value references are evaluated at runtime with managed syntax and allow you to reference job, run, or task metadata. They are not arbitrary templates or a place for secrets. The effective values ​​appear at execution, making it easy to reproduce and audit if the code uses the same semantics.",
        "A task can set a small task value, for example valid_ratio or snapshot_version, and a downstream condition can consume it. The dataset that produced that metric is durably written with run identity. If you try to serialize a huge list, limits, fragility, and lack of governance increase. The contract defines what happens if the value does not exist, is null, or comes from a retry. The test covers default, override and invalid reference."
      ],
      "concepts": [
        {
          "term": "Job parameters",
          "definition": "Value declared at the workflow level that configures a run and can be propagated consistently to multiple tasks.",
          "whyItMatters": "Avoid editing code by date or environment and leave the effective configuration recorded along with the execution."
        },
        {
          "term": "task value",
          "definition": "Small key-value pair published by a task for control or parameterization of other tasks of the same run.",
          "whyItMatters": "It allows you to communicate metrics and decisions without using orchestration as a transport of entire datasets."
        },
        {
          "term": "Dynamic value reference",
          "definition": "Reference resolved by Jobs to execution metadata or outputs available when a task is prepared.",
          "whyItMatters": "Connect context and control flow in an auditable way without manually copied values between notebooks."
        }
      ],
      "workedScenario": {
        "situation": "The validate task calculates 98.7% of valid rows and publish should be executed only from 99%; The team wants to pass the valid rows as JSON.",
        "reasoning": [
          "Persist valid rows in a staging table identified by date or run, because they constitute a governed dataset.",
          "Only publish valid_ratio as a small task value and compare that value in a condition task with the parameterized threshold.",
          "Test missing ratio, lower value, and validate retry to ensure that the decision uses the output of the correct attempt."
        ],
        "outcome": "The workflow conveys light control through task values and keeps data in a durable, auditable and permission-accessible surface."
      }
    },
    "keyPoints": [
      "Parameters are configuration",
      "Task values are small",
      "Data goes through storage"
    ],
    "decisions": [
      "Parameters are configuration",
      "Task values are small",
      "Data goes through storage"
    ],
    "example": {
      "title": "Value between tasks",
      "note": "Don't use count in declarative pipeline definitions; This example is classic Job task."
    },
    "pitfalls": [
      "Pass secrets as parameter",
      "Serialize DataFrame to task value"
    ],
    "examDecision": "For scalar value between tasks use task values; for dataset publishes governed table.",
    "checkpoint": {
      "question": "Is taskValues appropriate for a million rows?",
      "answer": "No; publishes the dataset to a governed table or file."
    }
  },
  "m10-l3": {
    "summary": "Retries, if/else, and for-each model recovery and control flow without duplicating logic.",
    "explanation": [
      "Retry handles transient failures if the task is idempotent; if/else evaluates a condition and for-each repeats over a bounded list.",
      "A branch is no substitute for data validation, and a massive loop can create too many tasks."
    ],
    "deepDive": {
      "mentalModel": "Retries recover transient failures; if/else choose a branch by a condition; for each repeats a parameterized task over a bounded collection. They are control flow primitives, not substitutes for data logic or an idempotent design. A safe retry assumes that re-executing the task does not duplicate effects. The condition should depend on a small, stable value, not the invisible state of a session. A loop needs concurrency limit, identity per element and strategy for partial failures. Modeling these paths on Jobs makes attempts and branches visible; Hiding them in a large notebook reduces observability and forces you to repeat already correct work.",
      "mechanics": [
        "max_retries and min_retry_interval_millis control new retries in failed states; timeout limits blocked tasks. Retrying a non-deduplicated append write can turn a post-commit network failure into duplicates, because the orchestrator does not know if the effect occurred. MERGE by key, bounded replaceWhere or commit with batch_id make the task repeatable. Deterministic data errors should fail toward quarantine or intervention, not consume identical retries.",
        "A condition task evaluates operators on available strings or values and activates differentiated outcomes. For each iterates inputs and can run elements in parallel within limits, useful for countries or backfill dates. The collection must be reasonable and does not replace a distributed Spark operation over millions of keys. In repair, affected tasks and attempts are chosen while preserving successful results. Each branch produces evidence and converges only when its preconditions are clear."
      ],
      "concepts": [
        {
          "term": "Retry",
          "definition": "Automatic retry of a failed task under a given number, interval and timeout policy.",
          "whyItMatters": "It is only safe when the task effects are idempotent and the error can be transient."
        },
        {
          "term": "Condition task",
          "definition": "Control node that evaluates two operands and determines which outcome dependencies are enabled.",
          "whyItMatters": "Makes an operational decision like publish, quarantine, or stop visible based on a small metric."
        },
        {
          "term": "For each task",
          "definition": "Control that runs a nested task for each element of a parameterized collection with limited concurrency.",
          "whyItMatters": "Simplifies bounded backfills or fan-outs without confusing orchestration with Spark queue parallelism."
        }
      ],
      "workedScenario": {
        "situation": "A list of thirty dates must be reprocessed; five fail due to missing files and the other twenty-five have already published results correctly.",
        "reasoning": [
          "Use for each with one date per element and idempotent writing per partition, limiting concurrency to protect sources.",
          "Classify missing file as a branch or actionable bug, avoiding repeated retries if the entry really does not exist.",
          "Repair only the five items when files arrive and reconcile partitions without repeating the twenty-five successes."
        ],
        "outcome": "Backfill preserves progress by date, protects dependent systems, and recovers partial failures without duplicating already committed results."
      }
    },
    "keyPoints": [
      "Retry requires idempotence",
      "If/else decides routes",
      "For-each requires limits"
    ],
    "decisions": [
      "Retry requires idempotence",
      "If/else decides routes",
      "For-each requires limits"
    ],
    "example": {
      "title": "Controlled retry",
      "note": "Classify permanent errors so as not to retry them uselessly."
    },
    "pitfalls": [
      "Non-idempotent append retry",
      "For-each with thousands of elements"
    ],
    "examDecision": "Transient failure: retry; value-based decision: if/else; dynamic small list: for-each.",
    "checkpoint": {
      "question": "What should be checked before activating retry?",
      "answer": "That repeating the task does not duplicate or corrupt results."
    }
  },
  "m10-l4": {
    "summary": "Schedule, file arrival and table update trigger Jobs by time or data availability.",
    "explanation": [
      "Schedule uses calendar and time zone; file arrival observes new arrivals; table update reacts to compatible table changes.",
      "Choose data signal when avoiding waiting or empty runs; Use calendar when the obligation is temporary."
    ],
    "deepDive": {
      "mentalModel": "Triggers respond to two types of obligation: time and data availability. A schedule declares when a run should start based on cron and time zone. File arrival reacts to new files in a supported location and avoids frequent polling. Table update responds to supported table updates and can coordinate downstream from published changes. Choosing data-driven reduces empty runs and latency when arrival is irregular; choosing calendar is correct when the commitment is a temporary closure even if there is no new data. No trigger tests that the input is complete: the Job still needs validation, idempotency, concurrency, and policy for multiple events.",
      "mechanics": [
        "A Quartz schedule includes seconds, expression, and timezone. Daylight saving time may produce different intervals or ambiguous executions in local areas; Using UTC simplifies when business does not require civil time. The concurrency configuration decides what happens if a previous run is still active. A cron every minute to check a monthly file creates thousands of empty runs and noise, even if it technically passes the check.",
        "File arrival observes a governed route and applies waiting parameters or minimum number of files depending on capabilities. Table update uses table update events to fire consumers. Events can be grouped and do not replace the incremental semantics of the task. A trigger must document origin, expected latency, run deduplication and backfill. If the SLA requires 06:00 even without input, a schedule with validation and alert is more honest than waiting indefinitely for a signal."
      ],
      "concepts": [
        {
          "term": "Schedule trigger",
          "definition": "Temporal trigger that creates runs using a cron expression interpreted in a declared time zone.",
          "whyItMatters": "It is appropriate when the process or closure obligation depends on the clock and not just new data."
        },
        {
          "term": "File arrival trigger",
          "definition": "Data-driven trigger that starts a Job by detecting new files in a supported location.",
          "whyItMatters": "Reduces polling and empty runs for file sources with irregular or unpredictable arrivals."
        },
        {
          "term": "Table update trigger",
          "definition": "Trigger that responds to updates observed in one or more tables supported by the platform.",
          "whyItMatters": "It allows decoupling producer and consumer using a governed publication as an operational signal."
        }
      ],
      "workedScenario": {
        "situation": "A partner delivers files between 08:00 and 14:00 without a pattern; the consumer requires publication twenty minutes after each arrival, not at a fixed time.",
        "reasoning": [
          "Choose file arrival because the real signal is availability of the object and a frequent cron would generate empty executions.",
          "Configure governed path, concurrency control and idempotent ingestion per file, measuring latency from creation to commit.",
          "Add a separate maximum no-show alert to detect that the partner did not deliver anything during the expected day."
        ],
        "outcome": "The Job responds with low latency to actual deliveries and maintains distinct vigilance for source breaches."
      }
    },
    "keyPoints": [
      "Cron depends on time zone",
      "File arrival is data-driven",
      "Table update follows tables"
    ],
    "decisions": [
      "Cron depends on time zone",
      "File arrival is data-driven",
      "Table update follows tables"
    ],
    "example": {
      "title": "Schedule UTC",
      "note": "Document how daylight saving time is affected if you do not use UTC."
    },
    "pitfalls": [
      "Cron without timezone",
      "File trigger on unstable route"
    ],
    "examDecision": "If the requirement says 'when the file arrives', choose file arrival, not frequent polling.",
    "checkpoint": {
      "question": "What trigger reduces empty runs when files arrive irregularly?",
      "answer": "File arrival trigger."
    }
  },
  "m10-l5": {
    "summary": "Run history, repairs, and alerts turn a failed DAG into an auditable recovery.",
    "explanation": [
      "Repair run reruns failed and dependent tasks without repeating unnecessary successes; parameter override allows you to correct a partition.",
      "Alerts must indicate owner, run and action. Spark UI serves execution; run history addresses trend and status of the workflow."
    ],
    "deepDive": {
      "mentalModel": "Run history explains the status of the workflow; Spark UI explains distributed execution within Spark tasks; alerts mobilize an owner; repair run recovers a subset preserving previous successes. These surfaces answer different questions and should form a runbook. First, job, run, task and attempt are identified; Then it is classified if the failure is orchestration, dependency, data, compute or plan. Repair does not correct a cause and should not be pressed before verifying idempotency. Lakeflow system tables allow you to analyze trends and SLAs beyond the available visual retention. A useful alert includes impact, link, owner and first action, not just the FAILED text.",
      "mechanics": [
        "Jobs records states by run and task, times, parameters and messages. A repair run creates attempts for selected and dependent tasks based on the graph; can support overrides to fix a partition. Successful task outputs must remain available and supported. If code is modified between attempt and repair, the execution is no longer an identical repetition and the change must be recorded. Rerunning everything can duplicate ingestion and prolong recovery unnecessarily.",
        "Spark UI opens when there is Spark execution and allows you to study stages, tasks, shuffle and skew. Query Profile serves SQL. system.lakeflow.job_run_timeline and related tables allow you to calculate success rate, duration and delays per period. Alerts are deduplicated to avoid fatigue and tiered by severity. After the incident, the runbook is updated with cause, evidence and prevention; A repair without learning leaves the same fragility."
      ],
      "concepts": [
        {
          "term": "Repair run",
          "definition": "Selective re-execution of failed or chosen tasks and their dependents within an existing run.",
          "whyItMatters": "Reduces time and risk by preserving successful work, as long as task boundaries are idempotent."
        },
        {
          "term": "run history",
          "definition": "Log of executions, states, parameters, attempts and Job times available for diagnosis and auditing.",
          "whyItMatters": "Locate where the workflow failed before investigating compute or data details."
        },
        {
          "term": "runbook",
          "definition": "Versioned operating procedure that connects symptoms, evidence, owner, recovery decision and closure criteria.",
          "whyItMatters": "It turns an alert into a consistent response rather than personal improvisation."
        }
      ],
      "workedScenario": {
        "situation": "Task Silver finished well, Gold failed due to a withdrawn permission, and the team proposes relaunching the entire DAG from ingestion.",
        "reasoning": [
          "Use run history to confirm the exact boundary and verify that Silver published a durable, idempotent result.",
          "Restore the least privilege of the production principal and verify it without changing data or unrelated configuration.",
          "Run repair from Gold, validate consumers and add grant detection to the deployment or preventive runbook."
        ],
        "outcome": "The service is recovered quickly without repeating ingestion and preventive control reduces the probability that the permit will break production again."
      }
    },
    "keyPoints": [
      "Repair preserves successes",
      "Override corrects the run",
      "Alerts must be actionable"
    ],
    "decisions": [
      "Repair preserves successes",
      "Override corrects the run",
      "Alerts must be actionable"
    ],
    "example": {
      "title": "History in system table",
      "note": "Join jobs to obtain name and segment by workspace."
    },
    "pitfalls": [
      "Relaunch everything after a single failed task",
      "Alert without link to run"
    ],
    "examDecision": "To recover part of a workflow, use repair run; to investigate trend, run history/system tables.",
    "checkpoint": {
      "question": "What prevents repeating already correct tasks?",
      "answer": "A repair run from failed or selected tasks."
    }
  },
  "m11-l1": {
    "summary": "Unity Catalog governs objects through hierarchy, ownership, and inheritance.",
    "explanation": [
      "Catalog contains schemas; Schemas contain tables, views, volumes and functions.",
      "Managed prioritizes Databricks management; external preserves cloud life cycle through credential and external location."
    ],
    "deepDive": {
      "mentalModel": "Unity Catalog models governance through a hierarchy of securables, ownership, and inheritable privileges. The metastore contains catalogs; catalogs contain diagrams; Schemas group tables, views, volumes, functions and models. Resolving catalog.schema.object identifies the resource without depending on the context. The owner can manage the object and delegate, but ordinary users must be given specific capabilities through groups or parent services. Managed and external change the storage lifecycle, not the existence of governance. The hierarchy allows granting at a broad level when the policy is truly common or to the object when isolation is needed; ease should not become generalized ALL PRIVILEGES.",
      "mechanics": [
        "Principals exist at the account level and receive privileges over securables. To use an object, permissions of the object and its ancestors are evaluated, in addition to workspace bindings or other applicable restrictions. Inheritance allows a GRANT in catalog or schema to affect current and future objects based on supported semantics. Ownership is powerful and should be reserved for administrator roles, not the user who happened to run an authoring notebook.",
        "Managed storage allows Unity Catalog to manage table location and lifecycle. For external data, a storage credential represents cloud access and an external location associates credential with route; users receive privileges on those objects instead of secrets. Volumes govern non-tabular files within the namespace. The selection of catalog and scheme reflects domain, environment and management boundary, avoiding a hierarchy by person that makes shared policies difficult."
      ],
      "concepts": [
        {
          "term": "Securable",
          "definition": "A Unity Catalog object on which you can grant privileges, establish ownership, and apply certain restrictions.",
          "whyItMatters": "It provides the concrete unit to design and audit least privilege within the platform."
        },
        {
          "term": "Ownership",
          "definition": "Administrative authority over a securable that allows it to be modified, granted access and transferred ownership under applicable rules.",
          "whyItMatters": "It must be assigned to stable roles because it goes beyond the simple ability to read or write data."
        },
        {
          "term": "Privilege inheritance",
          "definition": "Propagation of privileges granted in a container to descendant objects according to the Unity Catalog hierarchy.",
          "whyItMatters": "Simplifies policies by domain, but expands scope and requires review of the entire effective grant."
        }
      ],
      "workedScenario": {
        "situation": "A user personally created all Gold tables and leaves the company; Production Jobs depend on your ownership and external credentials.",
        "reasoning": [
          "Inventory objects, owners, grants, and credentials to separate data authority, execution identity, and cloud access.",
          "Transfer ownership to a stable administrator group and configure production primary services with inherited least privileges where appropriate.",
          "Replace personal credentials with storage credentials and managed external locations, verifying Jobs before revoking old access."
        ],
        "outcome": "The platform stops relying on a person's work cycle and retains management, execution, and storage under governed identities."
      }
    },
    "keyPoints": [
      "Three levels",
      "Ownership allows you to manage",
      "Managed recommended"
    ],
    "decisions": [
      "Three levels",
      "Ownership allows you to manage",
      "Managed recommended"
    ],
    "example": {
      "title": "Namespace",
      "note": "Grant privileges to the group, not individuals."
    },
    "pitfalls": [
      "Names of a part",
      "Credentials to end users"
    ],
    "examDecision": "Managed for new tables unless there is an explicit need for an external location.",
    "checkpoint": {
      "question": "What does a schema contain?",
      "answer": "Tables, views, volumes, functions and other objects."
    }
  },
  "m11-l2": {
    "summary": "GRANT, REVOKE and DENY apply minimum privilege to account principals.",
    "explanation": [
      "USE CATALOG and USE SCHEMA allow namespace traversal; SELECT authorizes reading of the object.",
      "Grant to parent groups or services and take advantage of inheritance; Explicit DENY prevails where supported."
    ],
    "deepDive": {
      "mentalModel": "GRANT adds a concession; REVOKE withdraws a specific concession; DENY, where supported, establishes an explicit prohibition that must be understood against inheritance. Reading a three-level table requires being able to traverse the catalog and schema using USE and having an effective SELECT on the object or an inheritable ancestor. USE does not allow reading rows and SELECT without access to ancestors is not enough to resolve the name. Grants are preferably allocated to major groups and services, not individually. Access analysis calculates effective permissions from all memberships and levels: withdrawing a direct GRANT may not change anything if the same permission is inherited.",
      "mechanics": [
        "GRANT USE CATALOG and USE SCHEMA enable namespace resolution, while SELECT, MODIFY, CREATE TABLE, or other privileges authorize specific actions. A principal can belong to several groups, and grants accumulate. SHOW GRANTS and the available information views help with investigation, but the context must include ownership and inheritance. ALL PRIVILEGES is dynamic based on product semantics and rarely represents least privilege for consumers.",
        "REVOKE removes the grant at the indicated level, it does not automatically deny permissions received through another path. Explicit DENY may prevail in supported scopes, but designing a tangle of negative exceptions makes reasoning difficult. The most maintainable strategy creates groups by responsibility, granting reading in product schemas and writing only to publishing principals. Tests impersonate or use equivalent test identities to demonstrate expected allow and deny."
      ],
      "concepts": [
        {
          "term": "GRANT",
          "definition": "An operation that grants a principal a specific privilege on a given Unity Catalog securable.",
          "whyItMatters": "It is the positive basis of the authorization model and must be limited to the capacity truly necessary."
        },
        {
          "term": "REVOKE",
          "definition": "Operation that removes a specific grant without removing other inherited or group paths that grant the same privilege.",
          "whyItMatters": "Explains why a user can retain access after withdrawing only their direct grant."
        },
        {
          "term": "Effective permit",
          "definition": "Aggregate result of ownership, direct grants, group membership, inheritance, and applicable prohibitions for an identity.",
          "whyItMatters": "This is the value that should be checked when diagnosing access, not a single isolated statement."
        }
      ],
      "workedScenario": {
        "situation": "SELECT direct to an analyst is revoked, but she continues reading Gold because she belongs to finance_all, which has SELECT in the entire catalog.",
        "reasoning": [
          "Calculate the effective permission and locate the grant inherited from the group, rather than assuming a cache or catalog miss.",
          "Decide whether finance_all should retain global scope or be divided into groups by product with more precise outline grants.",
          "Apply REVOKE or redesign at the correct level and test USE and SELECT with the affected identity before closing."
        ],
        "outcome": "Final access coincides with business policy and is explained by a comprehensible hierarchy, without improvised denials that hide excessive grants."
      }
    },
    "keyPoints": [
      "Principals are of account",
      "USE does not grant SELECT",
      "Groups simplify"
    ],
    "decisions": [
      "Principals are of account",
      "USE does not grant SELECT",
      "Groups simplify"
    ],
    "example": {
      "title": "Minimum reading",
      "note": "REVOKE withdraws a concession; Review inheritance before assuming effective loss."
    },
    "pitfalls": [
      "GRANT to each person",
      "SELECT without USE ancestors"
    ],
    "examDecision": "To read the table, USE on ancestors and SELECT on the object or inheritable level are required.",
    "checkpoint": {
      "question": "Does USE SCHEMA allow reading tables?",
      "answer": "Not by itself; SELECT is also required."
    }
  },
  "m11-l3": {
    "summary": "Lineage, audit logs and ABAC provide traceability and centralized policies.",
    "explanation": [
      "Lineage records relationships between objects; system.access.audit logs actions based on availability.",
      "ABAC uses governed tags and policies for masks and filters at scale; a direct mask fits in isolated cases."
    ],
    "deepDive": {
      "mentalModel": "Lineage answers where an object comes from and which consumers depend on it; audit logs answer who performed an action, when and from what context; ABAC applies policies through attributes and governed tags. They are related but not interchangeable controls. Lineage does not prove that a user read a particular row, and audit alone does not explain the semantic transformation between tables. A direct column mask or row filter serves a limited case; ABAC scales when the same classification, such as PII or region, must govern many objects. The policy is designed with controlled tags, safe functions, and minimal exceptions, and is tested with representative identities.",
      "mechanics": [
        "Unity Catalog captures lineage of supported operations at the table and column level, allowing you to evaluate impact before changes. system.access.audit provides action events based on availability and schema, useful for investigation and compliance. The correlation uses time, workspace, main, request and object, respecting retention. Neither a lineage chart nor an audited event replaces comments, owner and contract; provide complementary operational evidence.",
        "ABAC associates policies with catalogs or schemas and uses governed tags to select objects or columns, applying filters and masks centrally. Policy functions must avoid excessive dependencies and maintain performance. A direct mask is configured on a specific column; scaling hundreds of manual statements generates drift. Before deploying, administrators, service principals, allowed groups, restricted users, and behavior of joins or aggregations are checked for masked values."
      ],
      "concepts": [
        {
          "term": "Lineage",
          "definition": "Metadata that relates input objects and columns to results produced by operations captured by the platform.",
          "whyItMatters": "It allows impact analysis, discovery of dependencies and technical explanation of the origin of a metric."
        },
        {
          "term": "Audit log",
          "definition": "Temporary record of actions performed by principals on services and objects, with available context of the request.",
          "whyItMatters": "It supports investigation of who did what, but does not replace the transformation semantics of lineage."
        },
        {
          "term": "ABAC",
          "definition": "Attribute-based access control that applies centralized policies using governed tags and filtering or masking functions.",
          "whyItMatters": "Scale consistent protection by classification without manually configuring each sensitive column in each table."
        }
      ],
      "workedScenario": {
        "situation": "Hundreds of tables contain columns labeled PII; Support should see domains but not values, while compliance needs full and auditable access.",
        "reasoning": [
          "Create governed tags with restricted ownership and classify columns through a revised process, avoiding free, manipulable tags.",
          "Define an ABAC mask policy that preserves compliance and protects support, testing functions with both main groups and services.",
          "Use audit to monitor access and lineage to evaluate affected consumers, also measuring policy performance impact."
        ],
        "outcome": "Protection follows classification in a centralized and verifiable manner, while privileged access and dependencies remain visible for compliance and operation."
      }
    },
    "keyPoints": [
      "Lineage shows dependencies",
      "Audit shows actions",
      "ABAC applies by attributes"
    ],
    "decisions": [
      "Lineage shows dependencies",
      "Audit shows actions",
      "ABAC applies by attributes"
    ],
    "example": {
      "title": "direct mask",
      "note": "For many sensitive tables, evaluate ABAC policy with governed tags."
    },
    "pitfalls": [
      "Confuse lineage with audit",
      "Mask UDF with overaccess"
    ],
    "examDecision": "Repeated classification control: ABAC; single case: direct row filter/column mask.",
    "checkpoint": {
      "question": "What is the difference between audit and lineage?",
      "answer": "Audit records who did what; lineage relates data inputs and outputs."
    }
  },
  "m11-l4": {
    "summary": "Git folders allow branches, commits and pull requests from the workspace.",
    "explanation": [
      "They sync code with Git for collaboration and review.",
      "They do not store tables or replace CIs; Conflicts are resolved as in a normal repository."
    ],
    "deepDive": {
      "mentalModel": "Git folders provide a working copy of the repository within the workspace for branches, commits, pulls and pushes. Git is still the source of truth for the code; the provider hosts pull requests, review rules, and branch protection. A branch represents a pipeline of changes, not a data environment. Notebooks and files are versioned, but tables, checkpoints, secrets and execution results belong to other surfaces. The pro flow creates a short branch, modifies code and tests, syncs, opens pull requests, and lets CI validate. Copying folders as final_v2 avoids conflicts momentarily, but destroys common history and makes it impossible to know which version made it to production.",
      "mechanics": [
        "Git records snapshots of files through linked commits and detects divergences by serialized lines or cells. Pull incorporates remote changes; merge or rebase integrate histories according to policy; Conflicts require a human decision about intention. Git folders authenticates against the provider using configured credentials, which should not appear in the repository. Uncommitted changes may be lost or block updates and should be reviewed before switching branches.",
        "The pull request combines diff, conversation, checks and approval. CI installs pinned dependencies, runs tests, and builds an artifact; CD then deploys using a controlled identity. Table migrations are reviewed as code or resources, but the data does not travel in Git. A hotfix follows the same path with reduced scope and evidence, because directly editing the master branch of the workspace creates a non-reproducible production state."
      ],
      "concepts": [
        {
          "term": "Git folder",
          "definition": "Workspace directory connected to a remote repository that allows working with branches and synchronizing versioned files.",
          "whyItMatters": "Brings development closer to computing without turning the workspace into a substitute for the history and governance of the Git provider."
        },
        {
          "term": "Pull request",
          "definition": "Reviewable proposal to integrate commits from a branch, accompanied by diff, automatic checks and human decisions.",
          "whyItMatters": "Introduces a quality and security boundary before the change reaches the protected branch."
        },
        {
          "term": "Merge conflict",
          "definition": "A situation where Git cannot automatically decide how to merge concurrent changes to related content.",
          "whyItMatters": "It must be resolved by understanding the intention; Always choosing a version can delete valid logic or tests."
        }
      ],
      "workedScenario": {
        "situation": "Two engineers edit the same production notebook; one copies the file as orders_final and the other makes direct changes to main.",
        "reasoning": [
          "Stop the proliferation of copies and represent each change in a branch with small commits on the same source file.",
          "Resolve the conflict by comparing intent and tests, open pull request and require checks before integrating into protected main.",
          "Deploy the approved commit through automation and remove copies that do not correspond to a supported version."
        ],
        "outcome": "The production version is associated with a revised commit and the history preserves both contributions without depending on manual file names."
      }
    },
    "keyPoints": [
      "Versioned code",
      "Branches isolate changes",
      "PR reviews"
    ],
    "decisions": [
      "Versioned code",
      "Branches isolate changes",
      "PR reviews"
    ],
    "example": {
      "title": "Conceptual flow",
      "note": "The creation of the PR happens in the Git provider."
    },
    "pitfalls": [
      "Secrets Committee",
      "Direct editing in main"
    ],
    "examDecision": "To develop a feature create branch, commit, push and PR; do not copy notebooks by environment.",
    "checkpoint": {
      "question": "Where is a PR approved?",
      "answer": "In the integrated Git provider."
    }
  },
  "m11-l5": {
    "summary": "Declarative Automation Bundles bundle resources and promote the same code to targets.",
    "explanation": [
      "databricks.yml defines bundle, includes, variables, artifacts, resources and targets.",
      "validate checks configuration, deploy applies resources and run executes; dev/test/prod change variables and identity, not logic."
    ],
    "deepDive": {
      "mentalModel": "Declarative Automation Bundles, the current name of the capability formerly known as Databricks Asset Bundles, describe resources, artifacts, variables, and targets as code. databricks.yml is the root; include separates definitions; targets apply ambient overrides; artifacts build units like wheels; resources declares Jobs and pipelines. validate checks configuration, deploy creates or updates resources, and run executes a deployed resource. The essential principle is to build and test once, then promote the same commit or artifact by changing catalog, identity and parameters to target. Duplicating code for dev and prod prevents proving equivalence. The production run_as identity should be stable and minimal, never the user who launched the deployment by chance.",
      "mechanics": [
        "The CLI loads the configuration, resolves variables and targets, validates references and generates a resource plan with names and status associated with the bundle. In development mode you can apply prefixes or convenient behaviors; production requires deliberate configuration. deploy synchronizes artifacts and uses APIs to reconcile managed resources, but does not test the data logic itself. The deployer and run_as permissions are different responsibilities and should be limited.",
        "CI executes format, unit tests, validate and construction of the artifact in a commit. A test environment receives that same artifact with its own variables and integration tests. Promotion to prod references the approved version and requires controls. Secrets are obtained through governed mechanisms, not variables in text. Rollback means deploying a supported previous version and considering state or data migrations; It is not always enough to revert YAML if the schema has already changed."
      ],
      "concepts": [
        {
          "term": "Bundle target",
          "definition": "Named configuration that applies environment-specific values and overrides over a common resource definition.",
          "whyItMatters": "It allows you to separate catalog, workspace and identity without maintaining divergent copies of the production code."
        },
        {
          "term": "run_as",
          "definition": "Stable identity under which deployed resources run, independent of who invokes the deployment when it is configured.",
          "whyItMatters": "Prevents production from depending on personal permissions and makes it easier to apply least privilege to each workload."
        },
        {
          "term": "bundle validate",
          "definition": "Command that resolves and checks the bundle configuration for a target before applying remote changes.",
          "whyItMatters": "It detects invalid references and structure early, although it must be complemented with logic and integration tests."
        }
      ],
      "workedScenario": {
        "situation": "Dev works with a personal catalog, but production must use prod.sales, a main service and a wheel exactly the same as the one tested in test.",
        "reasoning": [
          "Declare code and Job only once, build the versioned wheel and parameterize the catalog using variables per target.",
          "Configure production run_as with minimal main service and run validate and integration tests on the immutable artifact.",
          "Promote the same version to prod through approval, verify resources and record effective commit, target and identity."
        ],
        "outcome": "The promotion preserves software equivalence and limits differences to revised configuration, with stable production identity and complete traceability."
      }
    },
    "keyPoints": [
      "Same artifact",
      "Targets configure",
      "CLI automates"
    ],
    "decisions": [
      "Same artifact",
      "Targets configure",
      "CLI automates"
    ],
    "example": {
      "title": "Targets",
      "note": "Add resources and run_as identity for production."
    },
    "pitfalls": [
      "Duplicate code by target",
      "Deploy prod with personal identity"
    ],
    "examDecision": "validate before deploy; uses variables/overrides to promote resources between environments.",
    "checkpoint": {
      "question": "What command checks a bundle?",
      "answer": "databricks bundle validate -t <target>."
    }
  },
  "m12-l1": {
    "summary": "The Associate project begins with verifiable criteria, not tools.",
    "explanation": [
      "Defines sources, SLA, consumers, security and acceptance.",
      "Map each requirement to component, test and evidence."
    ],
    "deepDive": {
      "mentalModel": "A certification project begins by translating an ambiguous story into observable criteria. Source, volume, frequency, mutability, SLA, consumers, security, cost and recovery define the problem; a list of services no. Each requirement becomes a metric, threshold, test and evidence with owner. Thirty-minute Freshness needs a start and end timestamp; zero duplicates need grain and key; Restricted access requires identities and negative test. The criteria also establish scope and discarded alternatives. This discipline prepares for the Associate exam because the situational questions include constraints whose combination eliminates plausible options. Choosing before specifying criteria favors keyword responses and architectures that are impossible to validate.",
      "mechanics": [
        "The discovery phase would invent sources and contracts, separate functional requirements from operational qualities, and ask what happens during failures or backfills. A traceability matrix relates each requirement to component, configuration, test and evidence. Assumptions are recorded and validated; for example, append-only completely changes file idempotency. A target such as fast is replaced by percentile, window, and representative volume.",
        "Acceptance includes happy path and downgrade: invalid data, repeated file, permission withdrawn, late source and retry. Each threshold has a response, such as block post, quarantine, or alert. The project does not need to demonstrate all of Databricks, but rather justify the minimum surface area it meets. During the examination, the same method identifies the option that simultaneously satisfies governance, operation and performance without adding unnecessary control."
      ],
      "concepts": [
        {
          "term": "Acceptance criteria",
          "definition": "A measurable condition with a threshold and checking procedure that determines whether a delivery satisfies a specific requirement.",
          "whyItMatters": "It transforms vague objectives into reproducible evidence and allows architectural decisions to be compared under the same obligations."
        },
        {
          "term": "Traceability matrix",
          "definition": "Explicit relationship between requirement, component, configuration, test, result and owner responsible for accepting the evidence.",
          "whyItMatters": "Avoid purposeless features and reveal important requirements that don't yet have a check in place."
        },
        {
          "term": "Assumption",
          "definition": "An unverified claim that is temporarily used for design and whose falsehood would change the decision or its validity.",
          "whyItMatters": "Making it visible allows you to validate it before it becomes a hidden production dependency."
        }
      ],
      "workedScenario": {
        "situation": "Business requests a fast pipeline without duplicates for orders, but does not define whether a row represents an order or a line or from what moment it measures speed.",
        "reasoning": [
          "Agree grain, key and version semantics to convert without duplicates into a reproducible query and test.",
          "Define freshness from file creation to Gold commit, with percentile and expected volume during the period of highest load.",
          "Map both obligations to ingestion, deduplication, metrics and owner, adding retry and late source tests."
        ],
        "outcome": "The project obtains criteria that discriminate solutions, allow validating the real SLA and avoid declaring success on an ambiguous order definition."
      }
    },
    "keyPoints": [
      "Measurable criteria",
      "Explicit scope",
      "Traceability"
    ],
    "decisions": [
      "Measurable criteria",
      "Explicit scope",
      "Traceability"
    ],
    "example": {
      "title": "Acceptance",
      "note": "Add owner and response to the breach."
    },
    "pitfalls": [
      "Start by cluster",
      "SLA without metrics"
    ],
    "examDecision": "Translate the requirement first; then select service.",
    "checkpoint": {
      "question": "What turns a goal into acceptance?",
      "answer": "A metric, threshold and way to check it."
    }
  },
  "m12-l2": {
    "summary": "The architecture integrates ingestion, transformation, governance, and consumption with minimal privilege.",
    "explanation": [
      "Use UC as border, Delta as table and appropriate compute per workload.",
      "Isolate dev/prod and design replay before automating."
    ],
    "deepDive": {
      "mentalModel": "The Associate architecture must form a chain of guarantees: a durable and governed entry allows replay; Delta contributes table commits; Silver adds contract; Gold serves consumers; Unity Catalog enforces identity and permissions; compute and Jobs execute and observe each frontier. No single component solves everything. The diagram should show data, control, identities and recovery, not just boxes. Dev and prod share code but separate catalogs, state and main. The choice between COPY INTO, Auto Loader or connector comes from the source; between SQL warehouse and Jobs compute, consumer and workload. A defensible architecture also explains two discarded alternatives and the change in requirement that would make them preferable.",
      "mechanics": [
        "The data path starts at Volume or external location, is ingested to Bronze with provenance, and is shaped to Silver using keys and quality. Gold materializes according to freshness and consultation. Unity Catalog resolves each name and grants the execution principal writes only to its targets; Analysts receive use of ancestors and SELECT in products. Checkpoints and schema locations remain per environment. The compute is created or scaled independently of storage.",
        "The control path uses Lakeflow Jobs for dependencies, parameters, triggers, retries and repair. Spark Declarative Pipelines can declare datasets when their managed capabilities fit; Previous materials may call the offering Lakeflow pipelines. Metrics and alerts test SLA, while run history and Spark UI separate workflow failure and distributed performance. Replay design is done before automating: durable origin, idempotent writes, and backfill procedures."
      ],
      "concepts": [
        {
          "term": "Chain of guarantees",
          "definition": "Boundary sequence where each layer adds a verifiable property without assuming that another tool will implicitly provide it.",
          "whyItMatters": "It allows you to locate faults and demonstrate that governance, quality, recovery and service are covered from end to end."
        },
        {
          "term": "identity border",
          "definition": "The point at which a particular principal receives only the privileges necessary to read or publish a governed object.",
          "whyItMatters": "Prevent shared credentials and limit the impact of a compromised or incorrectly configured Job."
        },
        {
          "term": "Discarded alternative",
          "definition": "Plausible option not chosen accompanied by the restriction, cost or capacity that justified excluding it in that context.",
          "whyItMatters": "Demonstrates comparative reasoning and allows the architecture to be revised if official requirements or capabilities change."
        }
      ],
      "workedScenario": {
        "situation": "Scheduled JSON requests should arrive on a dashboard within thirty minutes; Analysts only read Gold and production cannot depend on personal identities.",
        "reasoning": [
          "Design governed landing, Auto Loader or declarative pipeline towards Bronze, contractual Silver and Gold oriented to the dashboard with state separated by environment.",
          "Assign main production service to minimum Jobs and grants, serving BI through SQL warehouse without copying data to another system.",
          "Add trigger, checkpoint, idempotent writing, freshness metrics, alerts and repair; check COPY INTO if volume and SLA allow it."
        ],
        "outcome": "The solution meets latency and governance with a single data chain, can be resumed, and explains why each surface responds to a particular constraint."
      }
    },
    "keyPoints": [
      "UC rules",
      "Delta persists",
      "Compute is chosen"
    ],
    "decisions": [
      "UC rules",
      "Delta persists",
      "Compute is chosen"
    ],
    "example": {
      "title": "Flow",
      "note": "Add identities and checkpoints."
    },
    "pitfalls": [
      "Credentials in code",
      "One copy per team"
    ],
    "examDecision": "Select the component that resolves the particular constraint.",
    "checkpoint": {
      "question": "Where do you apply table permissions?",
      "answer": "Unity Catalog."
    }
  },
  "m12-l3": {
    "summary": "The implementation must be idempotent, parameterized and observable.",
    "explanation": [
      "COPY INTO/Auto Loader ingests, DataFrames form and Jobs coordinates.",
      "Each write is tested with second run and invalid data."
    ],
    "deepDive": {
      "mentalModel": "A trusted implementation is idempotent, parameterized, observable, and testable. Idempotent means that the same repeated input converges to the same logical state; parameterized means that date, catalog and mode are declared without editing code; observable means that each run publishes metrics and context; Testable means that tests and reconciliations detect deviations. COPY INTO or Auto Loader resolve file progress, not business duplicates. DataFrames express transformation; Delta MERGE or bounded replacement defines writes; Jobs coordinates. The decisive test runs twice, introduces a failure after a partial effect, and demonstrates that the recovery does not change correct counts or metrics.",
      "mechanics": [
        "Ingestion preserves batch_id, file_path and times. Silver deduplicates with deterministic key and sequence, converts types, and separates quarantine. A MERGE write uses font with one winning row per key; a Gold aggregate replaces a partition or recalculates using a controlled operation. Parameters are validated at the beginning and the code version is recorded. Each stage outputs input, output, rejected and duration to reconcile.",
        "Unit tests cover functions and rules with small data; integrations exercise catalog, delta and permissions in an isolated namespace; an end-to-end test verifies SLA and recovery. A retry is simulated around the commit point to detect duplicatable appends. Observability is not about printing: queryable metrics, run_id, task_key, and lineage connect evidence. The solution is only accepted when a second run produces the same expected state."
      ],
      "concepts": [
        {
          "term": "Business idempotence",
          "definition": "Property by which re-executing an identifiable input preserves a single correct representation of each entity or event.",
          "whyItMatters": "Complete technical guarantees of files and commits with the semantics necessary for safe production retries."
        },
        {
          "term": "End-to-end reconciliation",
          "definition": "Check that relates source units, valid rows, rejections, changes applied and results published during a run.",
          "whyItMatters": "Detects losses and multiplications that could go unnoticed even if all tasks end with SUCCESS status."
        },
        {
          "term": "Failure test",
          "definition": "Controlled experiment that interrupts an execution at a relevant point and verifies resumption and final state.",
          "whyItMatters": "Demonstrate actual recovery rather than assuming it from an unexercised retries configuration."
        }
      ],
      "workedScenario": {
        "situation": "A Job appends to Silver and loses connection before recording its final metric; Jobs retries and duplicates all orders in the batch.",
        "reasoning": [
          "Recognize that the first commit could be completed and that the absence of metrics does not demonstrate the absence of the lasting effect.",
          "Replace append with MERGE on key and sequence or idempotent replacement of the batch, registering batch_id in destination.",
          "Repeat the controlled failure and reconcile origin, changes and final inventory to demonstrate convergence after any attempt."
        ],
        "outcome": "The task can be retried after an ambiguous result and converges to the correct state without depending on whether the first attempt confirmed."
      }
    },
    "keyPoints": [
      "Replay",
      "Parameters",
      "Metrics"
    ],
    "decisions": [
      "Replay",
      "Parameters",
      "Metrics"
    ],
    "example": {
      "title": "Final check",
      "note": "If grain is not requested, use the correct key."
    },
    "pitfalls": [
      "Validate only happy path",
      "Non idempotent append"
    ],
    "examDecision": "A safe retry produces the same logical state.",
    "checkpoint": {
      "question": "How do you demonstrate idempotence?",
      "answer": "You repeat the same entry and compare status and metrics."
    }
  },
  "m12-l4": {
    "summary": "Operation combines run history, Spark UI, alerts and runbook.",
    "explanation": [
      "Run history locate task; Spark UI diagnoses execution.",
      "Runbook defines owner, repair and escalation."
    ],
    "deepDive": {
      "mentalModel": "Operating requires distinguishing workflow status, engine execution, and data product health. Run history shows which task, attempt, and parameter failed; Spark UI and Query Profile explain plans, stages and resources; Quality and freshness metrics show whether a technically successful run served valid data. Alerts direct an owner with impact and action. The runbook decides to pause, repair, rollback or backfill based on evidence. Repair run avoids repeating correct tasks, but only when the outputs are durable and compatible. A mature operation defines SLI, threshold and response before the incident, and preserves postmortem to eliminate the cause, not just restore the green color.",
      "mechanics": [
        "Triage begins with time, affected consumer, last good status, and recent change. run and task are located; if Spark started, plan and distribution are inspected; if not, compute events, permissions or dependencies. Table metrics compare freshness, volume and quality with baseline. An empty dashboard can come from a rule that filtered everything even if the Job is SUCCESS, so technical states and data results must be correlated.",
        "The runbook contains owner, links, queries, decisions and closing criteria. A repair can use fixed parameters and preserve upstream; a RESTORE recovers a Delta table when the commit was wrong; a backfill reconstructs periods with isolated state. Alerts are grouped together to avoid storms and tested. The postmortem adds preventive control, such as permission validation, canary or volume threshold, and checks that it actually fires."
      ],
      "concepts": [
        {
          "term": "SLI",
          "definition": "Quantitative indicator of the service, such as freshness, success rate, duration or quality ratio observed in production.",
          "whyItMatters": "It provides the objective signal that is compared to the target and triggers a proportional operational response."
        },
        {
          "term": "Triage",
          "definition": "Initial process of defining impact, phase, evidence and urgency before modifying systems or relaunching work.",
          "whyItMatters": "Avoid simultaneous changes and direct the team to the diagnostic surface that contains the probable cause."
        },
        {
          "term": "Closing criterion",
          "definition": "Verifiable set of data, service and prevention conditions that allows an incident to be declared resolved.",
          "whyItMatters": "Prevents closing solely because a task appears green while consumers or controls remain degraded."
        }
      ],
      "workedScenario": {
        "situation": "The Job appears SUCCESS, but Gold contains zero rows because a new conversion returned all dates to null and a filter silently removed them.",
        "reasoning": [
          "Treat it as a product incident, measure impact and locate the first stage where the volume deviated from baseline.",
          "Pause publishing, fix conversion with representative test and repair from Silver or restore Gold to last valid state.",
          "Validate rows, freshness and consumers; add volume threshold and quarantine that prevent another empty SUCCESS."
        ],
        "outcome": "The service recovers correct data and a preventive signal links quality with execution, preventing the technical state from hiding another total loss."
      }
    },
    "keyPoints": [
      "correct signal",
      "Selective Repair",
      "Owner"
    ],
    "decisions": [
      "correct signal",
      "Selective Repair",
      "Owner"
    ],
    "example": {
      "title": "Recent runs",
      "note": "Filter workspace and job."
    },
    "pitfalls": [
      "Rerun all",
      "Alert without action"
    ],
    "examDecision": "Workflow failed: run history; slow stage: Spark UI.",
    "checkpoint": {
      "question": "Where do you research skew?",
      "answer": "In metrics per Spark UI stage/task."
    }
  },
  "m12-l5": {
    "summary": "Associate preparation is measured by mastery and ability to decide in new scenarios.",
    "explanation": [
      "The current blueprint covers platform, ingestion, transformation, Jobs, CI/CD, diagnostics and governance.",
      "A helpful drill explains distractors and directs review; It does not memorize dumps."
    ],
    "deepDive": {
      "mentalModel": "Preparing for Associate means building mental models that allow you to decide in new scenarios, not memorizing menus or dumps. The blueprint valid for exams from May 4, 2026 organizes platform, development, ingestion, transformation, Jobs, CI/CD, troubleshooting and governance capabilities. Each simulation error is classified by domain and by cause: ignorance, hasty reading, ignored restriction or absolute distractor. The helpful review explains why the correct option satisfies all conditions and why each alternative fails at least one. The 80% of this academy is an internal indicator of preparation, not an official published grade. Practice should include code, operation, and decisions, not just questions.",
      "mechanics": [
        "The study plan is based on the current exam guide, exam date and official documentation. For each objective an explanation, an example and a counterexample are constructed. Spaced recovery reviews concepts, while laboratories provide procedural evidence. The drills are carried out with time and without documentation to measure decision; They are then reviewed without limit and each failure is linked to a source and exercise. Memorizing the answer letter does not create transfer.",
        "Situational questions often include clues about scale, latency, identity, state, or operation. First the dominant requirement is formulated, then incompatible options are discarded and finally the most managed or simple solution that satisfies is chosen, unless there is an explicit restriction. Words like always or never are suspicious when the product has conditions. Preparation ends when performance is stable by mastery and the person can defend decisions in their own voice, not by reaching a single random score."
      ],
      "concepts": [
        {
          "term": "Blueprint",
          "definition": "Official dated guide that lists assessable domains and objectives for a particular version of the certification exam.",
          "whyItMatters": "It defines the actual scope of preparation and should be reviewed if the exam date crosses a published update."
        },
        {
          "term": "Distractor",
          "definition": "Plausible option that violates a constraint, confuses layers, or applies a correct function to the wrong problem.",
          "whyItMatters": "Analyzing it develops conceptual discrimination and avoids depending on literally recognizing a previously seen response."
        },
        {
          "term": "Transfer",
          "definition": "Ability to apply an understood principle to a new scenario with different details, names, or restrictions.",
          "whyItMatters": "It is a more robust signal of preparation than memorizing questions, letters, or interface sequences."
        }
      ],
      "workedScenario": {
        "situation": "A student gets 87% when repeating the same drill, but fails permit labs and cannot explain why REVOKE does not eliminate an inherited grant.",
        "reasoning": [
          "Classify the result as a bank report and detect a conceptual weakness in Governance and Security, not as complete preparation.",
          "Restudy effective permissions with new scenarios, execute grants and revokes in the laboratory and verbalize each layer of inheritance.",
          "Perform another simulation with different questions and require stability per domain along with practical evidence before closing the review."
        ],
        "outcome": "Postscoring represents transferable reasoning and verifiable practice, reducing reliance on prior exposure to a fixed set of questions."
      }
    },
    "keyPoints": [
      "Blueprint rules",
      "Review by domain",
      "No dumps"
    ],
    "decisions": [
      "Blueprint rules",
      "Review by domain",
      "No dumps"
    ],
    "example": {
      "title": "Preparation log",
      "note": "Prioritizes government without abandoning integrated practice."
    },
    "pitfalls": [
      "Memorize answers",
      "Ignore weak domain"
    ],
    "examDecision": "Compare all options with restrictions; discards unjustified absolutes.",
    "checkpoint": {
      "question": "Is 80% the official grade?",
      "answer": "No; It is an internal indicator, not a threshold published by Databricks."
    }
  },
  "m13-l1": {
    "summary": "Structured Streaming runs an incremental query as a sequence of microbatches and preserves the progress needed to continue after a failure.",
    "explanation": [
      "A read with `readStream` describes a stream that is not yet running. Spark builds the plan, discovers what new data is available at each trigger, and only then materializes a microbatch. The DataFrames API itself allows you to reuse batch transformations, but a valid batch operation may not be viable in streaming if it requires maintaining unlimited state.",
      "In an order pipeline it is convenient to separate three decisions: how the input is discovered, which transformations are incremental, and how the output is confirmed. The SLA is not decided by `readStream`; It is determined by the trigger, the volume per batch, the capacity and the behavior of the sink in the event of retries."
    ],
    "deepDive": {
      "mentalModel": "Imagine Structured Streaming as an incremental query engine that advances a frontier of committed data, not as a loop that reruns an entire batch query. `readStream` declares a source whose end is moved; transformations build a logical plan and `writeStream` creates an active query. In each microbatch, Spark determines a new input range, executes only that delta, and coordinates the result with the checkpoint. The API seems identical to DataFrames batch because it shares algebra, but the feasibility changes: a projection is stateless, while counting by client forces information to be remembered between batches. That's why a production solution is designed around three boundaries: what progress the source offers, how much state the plan requires, and how the sink confirms. The trigger regulates when you try to advance; it does not by itself guarantee latency, capacity or exactly once.",
      "mechanics": [
        "When starting the query, Spark materializes the incremental plan and asks each source for its last available offset. For batch N, it first registers which range it intends to read, executes the partitions, updates stateful operators if they exist, and requests the sink to publish the result. When the write finishes, write down the batch commit at the checkpoint. The next trigger starts from the confirmed limit, not from a complete scan of the table. This sequence allows resuming after a driver failure and explains why the same query needs a unique and durable checkpoint location.",
        "Cost and latency emerge from the cumulative volume, key distribution, shuffles, state, and speed of the destination. If the batch takes longer than the configured interval, the triggers are not executed in parallel to magically recover the delay: the next execution begins when the motor is free. A batch transformation that requires all history, such as an unbounded global order, may be invalid or generate unbounded state. The design must limit the semantics through windows, watermarks or a subsequent batch stage, and must assume that a task can be repeated after a failure."
      ],
      "concepts": [
        {
          "term": "incremental query",
          "definition": "Plan that processes only the not-yet-committed input range and preserves continuity between runs.",
          "whyItMatters": "It avoids reasoning as if each trigger recalculates the entire source and allows cost and recovery to be estimated correctly."
        },
        {
          "term": "Microbatch",
          "definition": "Transactional unit of progress that groups a range of offsets, their computation and the attempt to write to the sink.",
          "whyItMatters": "It is the practical frontier for retries, metrics, idempotency, and latency diagnostics."
        },
        {
          "term": "stateful operator",
          "definition": "Transformation that maintains information from previous batches, such as an aggregation, deduplication, or stream-stream join.",
          "whyItMatters": "Its state conditions memory, checkpoint, compatibility of changes and need for watermarks."
        }
      ],
      "workedScenario": {
        "situation": "A trading platform receives order events around the clock, promises silver availability in less than five minutes, and must survive the driver crash without doubling revenue.",
        "reasoning": [
          "Classify the filter and selection as stateless, but recognize that a deduplication by `order_id` preserves state and needs a delay horizon.",
          "Choose a Delta sink and an exclusive checkpoint in governed storage, measuring that each microbatch ends comfortably within the SLA.",
          "Test for a failure after starting the write and verify that the reset resumes confirmed offsets and leaves a single logical version of each request."
        ],
        "outcome": "The pipeline advances only on new events, recovers its state from the checkpoint and meets the SLA with provable, not assumed, publication semantics."
      }
    },
    "keyPoints": [
      "`readStream` and `writeStream` define a continuous query; a batch action does not start it.",
      "Each microbatch processes an identifiable input range and confirms it at the checkpoint.",
      "A stateful transformation requires time limits and an explicit recovery strategy."
    ],
    "decisions": [
      "`readStream` and `writeStream` define a continuous query; a batch action does not start it.",
      "Each microbatch processes an identifiable input range and confirms it at the checkpoint.",
      "A stateful transformation requires time limits and an explicit recovery strategy."
    ],
    "example": {
      "title": "Minimum Incremental Query with Delta Destination",
      "note": "The `query` object allows you to check status and progress; The checkpoint must be unique to this query."
    },
    "pitfalls": [
      "Confusing trigger latency with actual processing time: if a batch takes two minutes, a ten-second trigger does not create additional capacity.",
      "Use the same checkpoint for two different queries or destinations, mixing incompatible offsets and commits."
    ],
    "examDecision": "If the requirement calls for recoverable incremental processing, look for a streaming source, a compatible sink, and a durable checkpoint; It is not enough to repeatedly execute a batch reading.",
    "checkpoint": {
      "question": "What part of the code actually starts the query?",
      "answer": "The terminal call of the `DataStreamWriter`, in this case `toTable`; `readStream` only builds the plan."
    }
  },
  "m13-l2": {
    "summary": "The trigger expresses when to try to process available data; `processingTime` prioritizes cadence and `availableNow` flushes the backlog and terminates.",
    "explanation": [
      "`processingTime` maintains an active query and launches microbatches with the requested frequency, as long as the previous one has finished. It is appropriate for a dashboard that must be updated throughout the day. Reducing the interval below the actual batch duration only increases planning pressure.",
      "`availableNow=True` processes all available data in one or more microbatches and exits. It fits with scheduled incremental jobs because it preserves checkpoints and batch limits without paying for an idle query. It also simplifies controlled backfills: the job ends when it reaches the start of the trigger."
    ],
    "deepDive": {
      "mentalModel": "A trigger is a service policy for an incremental query: it decides when to ask the engine to advance, but it does not change the semantics of the plan or manufacture capacity. `processingTime` keeps the query active and looks for a recurring cadence; `availableNow` captures the data available for that run, processes it into as many microbatches as the source limits require, and terminates. The choice is akin to deciding between a resident service and a finite incremental job. It must start from the freshness SLA, the way the data arrives, the compute startup time and the cost of maintaining idle resources. A ten second interval doesn't mean ten seconds of latency if each batch takes two minutes. Likewise, `availableNow` does not mean full batch: it preserves offsets, checkpoints, and incremental processing between orchestrated executions.",
      "mechanics": [
        "With `processingTime`, at the end of a microbatch the scheduler compares the clock with the next cadence. If the previous batch consumed the entire interval, it starts the next one as soon as it can; does not overlap two batches of the same query. With `availableNow`, the source sets a reachable boundary at the beginning of execution. Spark can subdivide the backlog based on options such as file boundaries or offsets, commits each subdivision, and stops the query when it reaches that boundary. The next execution opens the same checkpoint and requests only what is after the last commit.",
        "A resident query reduces startup latency and accommodates continuous arrivals, but consumes capacity even with low traffic and requires permanent operation. An `availableNow` job frees compute and fits with Jobs, although its minimum freshness includes the external trigger frequency plus startup and processing. Large backlogs require limits to avoid creating unmanageable batches; Too small limits multiply overhead. In both modes, a slow sink, hot Kafka partition, or oversized state store dominate the duration and must be diagnosed before shortening the cadence."
      ],
      "concepts": [
        {
          "term": "Processing time trigger",
          "definition": "Policy that attempts to repeatedly launch microbatches at a time cadence while the query remains active.",
          "whyItMatters": "It allows you to relate continuous latency to capacity, but does not guarantee that each batch finishes within the interval."
        },
        {
          "term": "Available Now",
          "definition": "Finite trigger that incrementally processes the available set at the beginning and ends after confirming all its microbatches.",
          "whyItMatters": "It is the key option for orchestrated incremental loads that must release compute without losing checkpoints."
        },
        {
          "term": "Execution boundary",
          "definition": "Upper input limit that a specific run commits to reaching before finishing.",
          "whyItMatters": "It distinguishes the data belonging to the current run from that which will remain for the next one and makes a backfill reproducible."
        }
      ],
      "workedScenario": {
        "situation": "A retailer receives files in bursts overnight; The dataset must be ready every fifteen minutes, but keeping a cluster active for hours without files is expensive.",
        "reasoning": [
          "Calculate the freshness as Job frequency plus start time and duration p95, checking that it fits within fifteen minutes.",
          "Use `availableNow` with stable checkpoint and input limits to split bursts without turning them into a single large batch.",
          "Alert if an execution does not empty its border before the next schedule, because then the requested cadence exceeds the effective capacity."
        ],
        "outcome": "Loading preserves incremental progress, terminates when there is no backlog left from its execution, and reduces idle cost without promising a latency that the compute cannot sustain."
      }
    },
    "keyPoints": [
      "`availableNow` retains incremental semantics and can create multiple batches until the input is exhausted.",
      "A trigger does not replace sizing nor does it itself control the size of the backlog.",
      "The choice is based on SLA, arrival pattern, and operating model, not syntax preference."
    ],
    "decisions": [
      "`availableNow` retains incremental semantics and can create multiple batches until the input is exhausted.",
      "A trigger does not replace sizing nor does it itself control the size of the backlog.",
      "The choice is based on SLA, arrival pattern, and operating model, not syntax preference."
    ],
    "example": {
      "title": "Finite incremental execution for a Job",
      "note": "The Job task terminates after consuming the available backlog, but the next execution resumes from the same checkpoint."
    },
    "pitfalls": [
      "Replace `availableNow` with a batch read and lose incremental offset tracking.",
      "Assume that `availableNow` is equivalent to a single microbatch; you can split the backlog based on source limits."
    ],
    "examDecision": "For an orchestrated incremental load that must finish and release compute, choose `availableNow`; for continuous latency, use a periodic trigger or SLA-compliant mode.",
    "checkpoint": {
      "question": "What happens if files arrive while an `availableNow` run is active?",
      "answer": "The execution processes the set delimited by the trigger; The data that is left out will be collected in the next execution from the checkpoint."
    }
  },
  "m13-l3": {
    "summary": "The checkpoint preserves offsets, commits, and state; It is part of the logical identity of a query, it is not a temporary folder.",
    "explanation": [
      "Upon restart, Spark queries the checkpoint to find out which source ranges were processed and which batches were committed to the sink. Stateful operations add metadata and data from the state store. Deleting the folder turns the next boot into a new query and may re-enter data or lose the expected position.",
      "Not all code changes are compatible with an existing checkpoint. Changing the number of sources, the Kafka topic, the sink type, the keys of an aggregation, or the state schema usually requires a new checkpoint and a migration or rework plan. A simple filter is usually supported, although it may change the functional result."
    ],
    "deepDive": {
      "mentalModel": "The checkpoint is the transactional and operational memory of a streaming query. It is not a simple cache that can be removed to fix errors: it contains the plan identity, the observed source ranges, the committed batches, and, when there are stateful operators, the state schema and contents. Think of it as the diary that allows you to answer what was read, what was published and what needs to be restored. The route belongs to a single logical query and a compatible version of its topology. Changing the topic, source type, sink, aggregation keys, or state store schema can invalidate that continuity. In that case, a new checkpoint is not a neutral repair; creates a new query and forces you to explicitly decide from which point to replenish data and how to reconcile the existing output.",
      "mechanics": [
        "Before running a microbatch, the offset log preserves the boundaries to be processed. After a successful write, the commit log marks the batch as completed. Stateful operators persist versions of the state store linked to the batch; during reboot, Spark rebuilds the committed version and continues with the next offset. If the process falls between write and commit, the protocol and the idempotency of the sink determine whether repeating the batch preserves the same result. The durability of the directory is therefore a dependence on production availability.",
        "Spark validates some compatibility when rolling back, but cannot guarantee that every code change preserves the business intent. Adding a filter can start with the same checkpoint, although it changes which future rows are published; modifying stateful keys usually requires a new state. A safe migration freezes the previous version, determines an offset or cut version, builds the new output from retained data, and compares invariants before changing consumers. Deleting the checkpoint without that sequence can re-ingest everything, skip expired history, or leave two incompatible truths."
      ],
      "concepts": [
        {
          "term": "Offset log",
          "definition": "Microbatch recording of the input limits that the query has planned and processed.",
          "whyItMatters": "It allows you to resume from a precise position and diagnose if the problem is before or after reading the source."
        },
        {
          "term": "Commit log",
          "definition": "Registration of batches whose output is considered confirmed for the query.",
          "whyItMatters": "Separates an incomplete attempt from a durable advance and participates in the prevention of improper reprocessing."
        },
        {
          "term": "State Compatibility",
          "definition": "Condition by which the state store topology, keys, schema, and provider can be restored with an existing checkpoint.",
          "whyItMatters": "Determines whether a deployment can resume or needs deliberate migration and rebuild."
        }
      ],
      "workedScenario": {
        "situation": "A team wants to add a second key to a fraud aggregation and proposes reusing the production checkpoint to avoid reprocessing six months of events.",
        "reasoning": [
          "Recognize that changing the keys modifies the schema and meaning of the state, so restoring with the current checkpoint is not compatible.",
          "Create a new version with separate checkpoint and destination, rebuilding it from the available hold to a documented cut offset.",
          "Compare totals and alerts during a parallel run before changing the consumed view and retain the old state for rollback."
        ],
        "outcome": "The update becomes an auditable migration, without corrupting the state store or confusing a clean boot with real continuity."
      }
    },
    "keyPoints": [
      "A checkpoint belongs to a query and must reside in durable, governed storage.",
      "Offsets and commits allow resuming; The state store allows rebuilding stateful operators.",
      "Changing the stateful topology without evaluating compatibility may prevent restarting."
    ],
    "decisions": [
      "A checkpoint belongs to a query and must reside in durable, governed storage.",
      "Offsets and commits allow resuming; The state store allows rebuilding stateful operators.",
      "Changing the stateful topology without evaluating compatibility may prevent restarting."
    ],
    "example": {
      "title": "Stable checkpoint path by environment and pipeline",
      "note": "Version the query when an incompatible change requires a new checkpoint; Keep the previous one until the cutover is verified."
    },
    "pitfalls": [
      "Save critical checkpoints in an ephemeral location or delete them as a first response to a failure.",
      "Reuse the production checkpoint during testing, advancing offsets or altering actual status."
    ],
    "examDecision": "In the event of a change in keys, source or state, evaluate checkpoint compatibility before restarting; creating a new one involves deciding from which data to reconstruct the result.",
    "checkpoint": {
      "question": "Why shouldn't a checkpoint be cleared to 'force' a retry?",
      "answer": "Because offsets, commits and status are lost; the query is no longer a resume and may duplicate, skip, or incorrectly reconstruct data."
    }
  },
  "m13-l4": {
    "summary": "The end-to-end guarantee depends on both offset tracking and the sink confirming batches idempotently.",
    "explanation": [
      "The integrated Delta sinks coordinate the commits of each microbatch with the checkpoint. If a task fails after writing but before committing, restart may resubmit the same batch and the sink must recognize it. The source guarantee alone does not prevent duplicates in an external service.",
      "`foreachBatch` opens the door to `MERGE`, multiple targets or APIs, but transfers responsibility to the code. The `batch_id` and a stable business key allow batch registration or deterministic upsert. Sending events to an endpoint without an idempotent key preserves, at most, at-least-once semantics."
    ],
    "deepDive": {
      "mentalModel": "Exactly-once is not a property that the Kafka source, checkpoint, or Delta can declare in isolation; It is an end-to-end result. Spark can resubmit a microbatch when it does not know if the previous attempt was published. An integrated transactional sink can recognize the batch and coordinate it with progress, while a REST API, mailer, or two independent destinations do not automatically participate in that protocol. That's why the correct mental model separates delivery from processing: at-least-once supports retries and possible repetition; idempotence causes repeating to produce the same final state. `foreachBatch` offers all batch expressiveness, including `MERGE`, but shifts responsibility for keys, order, and atomicity to the author. A `batch_id` identifies a logical intent of the query; a business key identifies the fact and tends to survive reconstructions with a new checkpoint better.",
      "mechanics": [
        "In each microbatch, Spark calls the `foreachBatch` function with a DataFrame and a monotonic identifier within that checkpoint. If the function terminates, the engine can log the commit; if the driver fails at the border, the same `batch_id` can be invoked again. A deterministic `MERGE` by key can turn the retry into a logical no-op, provided multiple changes of the same key are previously resolved. For external APIs, a persistent idempotent key is sent or a transactional ledger is used that records already accepted requests.",
        "Writing two sinks inside a function does not create a distributed transaction: the first can commit and the second fail. Repeating will resolve the divergence only if both tolerate duplicates and the order does not change the result. Persisting `batch_df` prevents recomputations when multiple actions are performed, but adds memory and does not resolve atomicity. If the output requires strong consistency between targets, the safest pattern is to commit a canonical Delta table and let independent consumers, each with their own checkpoint, publish the side effects idempotently."
      ],
      "concepts": [
        {
          "term": "At-least-eleven",
          "definition": "Guarantee that a record is not lost, even if a failure may cause one or more delivery attempts.",
          "whyItMatters": "It forces us to design consumers that tolerate repetition instead of inferring uniqueness from the existence of the checkpoint."
        },
        {
          "term": "Idempotence",
          "definition": "Property whereby applying the same operation several times leaves the same state as applying it once.",
          "whyItMatters": "Converts unavoidable retries into safe recovery for MERGE, APIs, and external effects."
        },
        {
          "term": "Business key",
          "definition": "Stable identifier of the fact or entity, independent of the batch and the technical intent that transports it.",
          "whyItMatters": "Allows deduplication even after rebuilding a query with another checkpoint or redistributing events."
        }
      ],
      "workedScenario": {
        "situation": "A payment flow updates a Delta table and calls a notification provider; the process crashes after accepting the external message but before confirming the microbatch.",
        "reasoning": [
          "Assume that the batch will be repeated and that the checkpoint alone cannot undo a call already accepted by an external system.",
          "Use `payment_id` as the provider's idempotent key and do `MERGE` deterministic on the canonical table, recording the publication status.",
          "Separate the notification into a Delta table consumer if you need to isolate faults and retry the effect without rerunning the main transformation."
        ],
        "outcome": "The failure produces an observable retry, but neither the balance nor the notification is duplicated because each external border recognizes the identity of the payment."
      }
    },
    "keyPoints": [
      "Exactly-once is a property of the source–state–sink path, not an isolated tag.",
      "`foreachBatch` allows batch logic per microbatch and must tolerate repetition of the same batch.",
      "A business key is often more useful than relying solely on the batch number."
    ],
    "decisions": [
      "Exactly-once is a property of the source–state–sink path, not an isolated tag.",
      "`foreachBatch` allows batch logic per microbatch and must tolerate repetition of the same batch.",
      "A business key is often more useful than relying solely on the batch number."
    ],
    "example": {
      "title": "Idempotent upsert by microbatch",
      "note": "The `MERGE` should resolve multiple changes of the same key within the batch before the upsert."
    },
    "pitfalls": [
      "Do `append` on `foreachBatch` and assume that the checkpoint prevents any repetition after the failure.",
      "Perform various actions on `batch_df` without persisting it when the recomputation cost is relevant."
    ],
    "examDecision": "If the sink does not participate in commits exactly once, design explicit idempotence with key or batch ledger and accept that delivery can be repeated.",
    "checkpoint": {
      "question": "What should a `foreachBatch` function guarantee to support retries?",
      "answer": "Running the same microbatch again produces the same final state, usually using deduplication, `MERGE` or an idempotent key."
    }
  },
  "m13-l5": {
    "summary": "The progress of a query allows you to separate lack of input, insufficient capacity, increasing status and sink problems.",
    "explanation": [
      "`lastProgress` exposes input and process rates, phase durations, offsets, and status metrics. If `inputRowsPerSecond` consistently exceeds `processedRowsPerSecond`, the backlog grows; If there are no new rows, a high latency may come from the trigger or the sink itself. In Kafka, the offsets provide another independent signal.",
      "The operation requires SLA-bound thresholds: maximum freshness, batch p95 duration, discarded rows, and state size. A useful runbook connects each alert with hypotheses and safe actions, avoiding restarting or deleting checkpoints without diagnosis."
    ],
    "deepDive": {
      "mentalModel": "Observing streaming consists of reconstructing a causal chain between arrival, processing, state and publication. That a query is `ACTIVE` only says that the driver has not finished; It does not demonstrate that it receives events, advances offsets or meets business freshness. The progress of each microbatch provides a snapshot: input rows and bytes, rates, duration per phase, offsets and stateful operator metrics. The correct reading compares series, not a single sample. If the input steadily exceeds the process, the backlog grows; if both are low but the duration is high, you can dominate the sink, bootstrap, or a rowless operator. Freshness is measured with event time of the last valid data against the clock and must be complemented with completeness, quality failures and consumer latency. Thus, each alert leads to a testable hypothesis instead of blind restarts.",
      "mechanics": [
        "After each trigger, `StreamingQueryProgress` exposes the batch identifier, timestamps, calculated rates, schedule and execution duration, source and sink descriptions, and `stateOperators`. These metrics can be serialized to an operations table. For Kafka they correlate with offsets and lag; for files, with the backlog of files or bytes. A robust freshness metric computes `current_timestamp - max(event_time)` on the published output, differentiating a source still by design from an ingestion blocked by an activity expectation.",
        "Instantaneous rates are noisy: a microbatch emptying one burst may show high capacity and the next zero. Percentiles and sustained windows aligned with the SLA are used. A status that increases without the watermark advancing suggests late data, a stopped input partition, or excessive threshold; a high `processedRowsPerSecond` with slow sink can hide that the commit dominates. Scaling compute helps only when parallelizable phases are saturated. First you have to rule out source throttling, skew, small files, slow external API and deliberately configured limits."
      ],
      "concepts": [
        {
          "term": "Backlog",
          "definition": "Amount of data available in the source that is not yet part of a confirmed commit of the query.",
          "whyItMatters": "It distinguishes lack of capacity from absence of data and allows estimating recovery time."
        },
        {
          "term": "Freshness",
          "definition": "Difference between the observation clock and the most recent event time that successfully arrived in the data product.",
          "whyItMatters": "It measures the SLA perceived by the consumer, which is not derived from the simple active state of the process."
        },
        {
          "term": "State operator metric",
          "definition": "Per-operator metrics on rows maintained, updated, deleted, and memory or state storage.",
          "whyItMatters": "Reveals unbounded growth and separates stateful problems from source or sink necks."
        }
      ],
      "workedScenario": {
        "situation": "A dashboard shows sales forty minutes late even though the Job is green and the query appears active; operations proposes to duplicate workers immediately.",
        "reasoning": [
          "Compare pending offsets and rates over several batches to check if backlog exists or if the source stopped producing events.",
          "Break down `durationMs` and `stateOperators`, and calculate the freshness of the maximum published `event_ts` to locate slow sink or increasing state.",
          "Apply the specific action—repartition, adjust state, repair sink, or escalate—and verify that the trend recovers the SLA before closing the alert."
        ],
        "outcome": "The runbook identifies the actual neck and restores freshness with a measurable intervention, avoiding spending more compute when the cause is outside the engine."
      }
    },
    "keyPoints": [
      "Compare arrival rate with process rate over multiple batches, not a single sample.",
      "`stateOperators` reveals rows and memory maintained by aggregations, joins, or deduplication.",
      "Business freshness requires comparing the maximum published event time with the clock, not just observing that the query is active."
    ],
    "decisions": [
      "Compare arrival rate with process rate over multiple batches, not a single sample.",
      "`stateOperators` reveals rows and memory maintained by aggregations, joins, or deduplication.",
      "Business freshness requires comparing the maximum published event time with the clock, not just observing that the query is active."
    ],
    "example": {
      "title": "Defensive inspection of latest progress",
      "note": "In production, send these metrics to a table or monitoring platform instead of relying on driver printouts."
    },
    "pitfalls": [
      "Interpret an `ACTIVE` query as proof that you meet the freshness SLA.",
      "Increase compute without checking for neck in sink, state, source throttling or skewed data."
    ],
    "examDecision": "When faced with a delayed stream, compare backlog, rates, microbatch duration and status metrics before changing resources or the trigger.",
    "checkpoint": {
      "question": "What signal distinguishes a growing backlog from a momentarily empty supply?",
      "answer": "The backlog or pending offsets grow and the input rate steadily exceeds the processed rate; an empty font does not accumulate new offsets."
    }
  },
  "m14-l1": {
    "summary": "The event time belongs to the business fact; The processing time describes when the platform observes it and does not correct the arrival disorder.",
    "explanation": [
      "A payment generated at 10:03 can arrive at 10:17 due to a mobile disconnection. Grouping by ingest time would assign it to a different window and cause a reprocess to produce another result. The event time column must come from the event, be converted to `timestamp`, and be validated before any temporal operations.",
      "The delay `processing_time - event_time` is a distribution, not a constant. To choose tolerance, percentiles and extreme cases are studied by source. A defective producer watch must be sent to quarantine; extending the watermark indefinitely to hide it transfers the problem to the state store."
    ],
    "deepDive": {
      "mentalModel": "Event time and processing time answer different questions. Event time belongs to the fact: when the purchase, read or click occurred according to the producer. Processing time belongs to the platform: when the event was observed and transformed. In a distributed system, retries, moving disconnects, buffers, and partitions cause the order of arrival to differ from the order of business. Structured Streaming can't correct that mess by looking at the cluster clock; you need a valid event time column and an explicit lateness policy. The useful mental model is a timeline moving forward with imperfect evidence: each source reveals observed maxima, the watermark derives a conservative boundary, and traders decide when to stop waiting. Before adding, you must normalize time zone, precision, impossible values ​​and producer semantics, because an incorrect timestamp can advance the border and expel legitimate data.",
      "mechanics": [
        "The payload is deserialized with a scheme that converts the producer flag to `timestamp`. Spark associates watermark metadata with that column when `withWatermark` is called. Subsequent stateful operators use the maximum observed event time minus the configured delay to determine which state no longer needs to be preserved. The processing time still governs when triggers and timeouts of this type are executed, but it should not replace the event time in business windows. Acceptable late events update existing windows; those that are too old may be discarded depending on the operator and output mode.",
        "A source with faulty clocks can output a future date and prematurely move its maximum, causing apparent loss of normal events. Defense includes range validation, quarantine and skew metrics between event and ingestion time. Converting all zones to UTC preserves comparability, but the business zone may still be necessary for daily outages. A short lateness threshold reduces state and latency; a long one increases historical correction and cost. The decision is based on the actual delay distribution and the cost of correcting out-of-window data."
      ],
      "concepts": [
        {
          "term": "Event time",
          "definition": "Moment in which the event occurred according to the producing domain, transported as part of the event.",
          "whyItMatters": "It is the right foundation for windows, order of business, and reproducible analysis despite network delays."
        },
        {
          "term": "Processing time",
          "definition": "Instant when the engine receives or processes the event in a specific execution.",
          "whyItMatters": "It is used for operation and triggers, but produces results dependent on delays and re-executions if used as business time."
        },
        {
          "term": "Ingestion time",
          "definition": "Mark added when entering a controlled platform border.",
          "whyItMatters": "It allows measuring delay and detecting abnormal clocks without replacing the semantics of the event time."
        }
      ],
      "workedScenario": {
        "situation": "Sensors in three countries send readings with local zone, some devices are offline for six hours and one advances its clock two days after a faulty update.",
        "reasoning": [
          "Convert the timestamp with the declared zone to UTC and preserve ingestion time to measure the distribution of delays per device.",
          "Quarantine future or impossible dates before applying the watermark, preventing a spurious maximum from advancing the global border.",
          "Choose the threshold according to delay percentiles and define a correction route for the small percentage that arrives outside the window."
        ],
        "outcome": "The windows represent when the reads occurred, the state is bounded, and a broken clock does not cause silent deletion of valid data."
      }
    },
    "keyPoints": [
      "Event time determines playable windows; processing time measures the observation of the system.",
      "The quality and time zone of the timestamp are part of the event contract.",
      "The lateness distribution informs the watermark and the fixes SLA."
    ],
    "decisions": [
      "Event time determines playable windows; processing time measures the observation of the system.",
      "The quality and time zone of the timestamp are part of the event contract.",
      "The lateness distribution informs the watermark and the fixes SLA."
    ],
    "example": {
      "title": "Event time normalization",
      "note": "It preserves both tenses: one governs the semantics and the other allows the behavior of the source to be measured."
    },
    "pitfalls": [
      "Use `current_timestamp()` as the event time because it is always present, causing a replay to change the results.",
      "Accept timestamps without zone or very future and allow them to advance the watermark prematurely."
    ],
    "examDecision": "If the result must preserve the actual business time despite delays or replays, windows must use validated event time.",
    "checkpoint": {
      "question": "Why should a reprocess preserve the original event time?",
      "answer": "Because this way the event returns to the same business window; using rework timing would produce different aggregates."
    }
  },
  "m14-l2": {
    "summary": "A window groups by event time and the watermark limits how much state is retained before considering a window finalizable.",
    "explanation": [
      "Tumbling windows do not overlap; sliding can assign the same event to multiple windows. In an aggregation, Spark maintains accumulators for windows still open. The watermark advances from the maximum observed event time minus the configured delay and allows the old state to be removed.",
      "A short tolerance reduces memory and speeds up final results, but discards more late events. A long tolerance improves completeness at the cost of latency and state. The decision must express a measurable commitment, for example accepting 99.5% of events within fifteen minutes and correcting the rest through a separate process."
    ],
    "deepDive": {
      "mentalModel": "A window transforms an infinite flow into finite temporal groups; a watermark provides the evidence to stop maintaining some of those groups. It is neither a timer that waits exactly N minutes after each event nor a promise that everything before it will be discarded at a precise instant. Spark looks at the maximum event time seen and subtracts the configured delay to get a boundary. A window whose end is far enough behind can be closed and its state deleted depending on the exit mode. The trade-off is explicit: expanding latency protects more out-of-order events, but conserves more keys and windows, increases checkpoint, and delays final results. Reducing it improves cost and latency in exchange for an exception path. The checked column must be the same one that powers `window`; losing your metadata through misplaced expressions can prevent expected behavior.",
      "mechanics": [
        "In an aggregation, each microbatch assigns rows to windows using event time, looks up or creates the corresponding keys in the state store, and updates accumulators. The watermark is calculated from the maximum observed minus the delay. In append mode, a result can be published when the window is considered final and the state can be evacuated; In update mode, compatible changes are issued while the window is still open. Complete mode preserves and rewrites all output, so it doesn't offer the same deletion benefit. Progress reports updated and deleted rows to check the actual effect.",
        "With multiple sources, each maintains its watermark and Spark derives a global boundary. The conservative default policy advances with the slowest source, avoiding marking your data as late but delaying output and state cleanup. A faster source-based policy reduces latency at the cost of discarding data from the lagging stream, and is only justified by an explicit contract. An inactive partition, misaligned clocks, or future events alter the progression; That is why maximum event time, watermark and state size are monitored together."
      ],
      "concepts": [
        {
          "term": "tumbling window",
          "definition": "Contiguous intervals of fixed size without overlap, where each event belongs to a single window.",
          "whyItMatters": "Simplifies totals per minute or hour and limits the number of active accumulators per key."
        },
        {
          "term": "sliding window",
          "definition": "Fixed-sized intervals started at a slower cadence, so an event can belong to multiple windows.",
          "whyItMatters": "It allows moving metrics, but multiplies updates and status with respect to a tumbling window."
        },
        {
          "term": "Watermark",
          "definition": "Boundary derived from the maximum observed event time minus a lateness tolerance.",
          "whyItMatters": "It gives the engine a condition to clear state and the business a quantifiable policy on late data."
        }
      ],
      "workedScenario": {
        "situation": "A fraud system calculates ten-minute counts every minute and must tolerate mobile events that arrive up to thirty minutes late in 99.8% of cases.",
        "reasoning": [
          "Recognize that the sliding window replicates each event in several windows and size state by active keys, overlap and thirty minutes of tolerance.",
          "Apply the watermark on the validated event column before grouping, selecting an output mode compatible with the consumption of partial results.",
          "Measure rows removed from the state store and route the 0.2% out of window to a batch fix instead of increasing the delay indefinitely."
        ],
        "outcome": "The detector delivers moving metrics with controlled lateness, predictable state cost, and an explicit policy for extreme exceptions."
      }
    },
    "keyPoints": [
      "Watermark does not mean waiting exactly that amount of time from the arrival of each row.",
      "The marked column must participate in the window or temporary condition of the stateful operator.",
      "Output mode and watermark determine when results are output and withdrawn."
    ],
    "decisions": [
      "Watermark does not mean waiting exactly that amount of time from the arrival of each row.",
      "The marked column must participate in the window or temporary condition of the stateful operator.",
      "Output mode and watermark determine when results are output and withdrawn."
    ],
    "example": {
      "title": "Five-minute window sales",
      "note": "The fifteen minute delay must be justified by the actual lateness distribution and publishing SLA."
    },
    "pitfalls": [
      "Apply `withWatermark` to one column and group by another, preventing the operator from using the expected timestamp.",
      "Choose a watermark equal to the trigger interval; They solve different problems."
    ],
    "examDecision": "To narrow down an event time aggregation, set watermark to tolerated lateness and use that column in `window`; do not replace it with more partitions.",
    "checkpoint": {
      "question": "What is sacrificed by reducing the watermark from one hour to ten minutes?",
      "answer": "Less state is preserved and may lower latency, but it increases too late events that will no longer update the result."
    }
  },
  "m14-l3": {
    "summary": "Watermark deduplication maintains identifiers for a finite horizon and eliminates repetitions without growing state forever.",
    "explanation": [
      "`dropDuplicatesWithinWatermark([\"event_id\"])` remembers observed keys as long as the event can still have duplicates within tolerance. The timestamp must be defined beforehand. If two copies can differ in timestamp, the tolerance must exceed the maximum temporal distance between them to ensure deduplication.",
      "The key must represent business identity, not an accidental combination of all columns. Before deduplicating, it is advisable to validate nulls and normalize types. Events that arrive later than the threshold can be discarded; discard metrics and a reconciliation path are part of the design."
    ],
    "deepDive": {
      "mentalModel": "Deduplicating a stream means remembering identities already observed during the period in which they could still be repeated. Without a limit, any historical identifier could reappear and the state store would have to grow forever. The watermark delimits that temporal obligation, but the key and timestamp must represent the real contract. `dropDuplicatesWithinWatermark` is intended to keep the key within the horizon even if the duplicates have slightly different timestamps; combining `dropDuplicates` with a temporary column in the key can treat each timestamp as a different record. Technical deduplication also does not replace the idempotence of the destination: an event can leave this operator only once and still be repeated due to a failure in an external call. First it is decided what constitutes the same event, how long it can be repeated, and what to do with a repetition older than the retention.",
      "mechanics": [
        "For each row, the operator derives the deduplication key, queries the state store, and decides if it is new. If it does not exist, it registers it and lets the queue pass; if it already exists within the retained state, it is discarded. The watermark on event time allows you to eliminate keys whose possible replay window has expired. The state and its changes are checked by microbatch, so that a reboot does not immediately forget the identities. The discarded rows metric should distinguish expected duplicates from a failing producer resending failed volumes.",
        "The horizon should cover the maximum upstream retry interval, not just the average delay. Increasing it increases cardinality, storage and checkpoint duration; reducing it causes very late duplicates to be considered new again. If a business table with a logical unique key exists, a subsequent MERGE adds a second barrier and allows the entire history to be reconciled. For events without an identifier, building a trace of all columns is fragile to mutable fields; It is advisable to correct the contract at source or define a stable and documented composite key."
      ],
      "concepts": [
        {
          "term": "Deduplication key",
          "definition": "Minimum set of attributes that stably identifies a single business event.",
          "whyItMatters": "An incorrect key deletes legitimate events or passes retries as if they were different events."
        },
        {
          "term": "Deduplication horizon",
          "definition": "Period during which the engine retains a key because it is still accepting the arrival of a repetition.",
          "whyItMatters": "Directly controls the balance between late retry correction and state store size."
        },
        {
          "term": "dropDuplicatesWithinWatermark",
          "definition": "Operator that deduplicates by keys within the marked time tolerance without requiring the timestamp as part of the identity.",
          "whyItMatters": "Resolves producers that reissue the same identifier with small temporal variations and maintains bounded state."
        }
      ],
      "workedScenario": {
        "situation": "A gateway retains events during incidents and can forward them for 48 hours; each retry keeps `event_id`, but updates the transmission timestamp.",
        "reasoning": [
          "Define `event_id` as the identity and use the validated business time for a watermark greater than the 48-hour retry contract.",
          "Avoid including the transmission timestamp in the key, because it would convert each forward into a different identity.",
          "Add `MERGE` for `event_id` in the canonical table and alert on duplicate rates to detect retry storms."
        ],
        "outcome": "Normal forwards are absorbed over the horizon, the state does not grow indefinitely, and the destination retains an additional history barrier."
      }
    },
    "keyPoints": [
      "`distinct` without watermark can preserve all unique rows indefinitely.",
      "`dropDuplicatesWithinWatermark` requires a timestamp on the streaming DataFrame.",
      "The horizon must cover the maximum expected separation between copies of the same event."
    ],
    "decisions": [
      "`distinct` without watermark can preserve all unique rows indefinitely.",
      "`dropDuplicatesWithinWatermark` requires a timestamp on the streaming DataFrame.",
      "The horizon must cover the maximum expected separation between copies of the same event."
    ],
    "example": {
      "title": "Identifier-bounded deduplication",
      "note": "Measure duplicates and late events with test data that crosses multiple microbatches."
    },
    "pitfalls": [
      "Deduplicate for all columns when two copies have different `ingested_at` and, therefore, never match.",
      "Choose a threshold lower than the delay between duplicates and promise a guarantee that the state can no longer fulfill."
    ],
    "examDecision": "If there is a stable ID and delayed duplicates, use watermark deduplication; an unlimited `dropDuplicates` can compromise memory and latency.",
    "checkpoint": {
      "question": "What condition allows an old `event_id` to be removed from the state?",
      "answer": "That the watermark has advanced beyond the horizon in which it is still guaranteed to recognize duplicates of that event."
    }
  },
  "m14-l4": {
    "summary": "A join between two streams needs watermarks and a time condition so that Spark can discard pairs that can no longer match.",
    "explanation": [
      "Matching clicks to payments only by `session_id` leaves the possibility of a future match forever open. Adding that the payment occurs between the click and thirty minutes later provides a limited interval. Each input must declare its lateness tolerance for the engine to calculate when to withdraw state.",
      "Outer joins require waiting for the horizon to elapse before emitting an unmatched row. That increases the latency of the expected `NULL`s. On multiple streams, the default global policy advances with the slowest watermark; changing it to `max` reduces latency, but may discard data from the lagging stream."
    ],
    "deepDive": {
      "mentalModel": "A stream-stream join attempts to pair two sets that never stop growing. A key equality is not enough to know when to delete an unmatched row: in theory, its match could arrive years later. To limit status, watermarks are needed on the entries and a temporal condition that limits which pairs are valid, for example a print that occurred between zero and thirty minutes before a purchase. The engine combines those constraints to decide when an event can no longer find a future mate. Inner joins can be executed without watermark, but would retain state without limit; outer joins need limits to determine when to cast the null side. The mental model is twofold: the key reduces candidates and the time interval closes the search. The global watermark and the slowest source determine when it is cleaned and when unmatched results appear.",
      "mechanics": [
        "Each microbatch inserts new rows from both streams into state stores indexed by the equality keys and searches for matches against the opposite state. The temporal expression filters pairs outside the allowed range. With watermarks, Spark estimates when a row on one side is too old for a future event on the other to satisfy the condition; then delete it. In outer join, only then can you safely cast a row with null for the missing side. The supported mode is append, because committed peers are published incrementally.",
        "Asymmetric delays require different watermarks and a range based on domain knowledge. A wide tolerance preserves more data and raises status; a close loses legitimate matches. Skew on a popular key produces hot partitions even though retention is finite. Invalid fields are filtered out before the join, identities are deduplicated, and when a dimension changes slowly but is not a stream equivalent, a stream-static join with controlled snapshot may be preferred. A stopped fountain can slow down the overall watermark and delay cleanup, so it should be monitored separately."
      ],
      "concepts": [
        {
          "term": "Temporary condition",
          "definition": "Predicate that limits the difference allowed between the event times of two join candidate rows.",
          "whyItMatters": "Makes it possible to demonstrate that an old row will no longer be able to be matched and allows its state to be cleared."
        },
        {
          "term": "global watermark",
          "definition": "A boundary derived from multi-input watermarks that governs joint stateful operators.",
          "whyItMatters": "Explains why one slow source can retain state and delay outputs even though the other is moving forward."
        },
        {
          "term": "Stream-static join",
          "definition": "Join between an incremental flow and a batch relationship read as a reference during the query.",
          "whyItMatters": "It typically requires less state than stream-stream and is appropriate when one side does not need continuous temporal pairing."
        }
      ],
      "workedScenario": {
        "situation": "Advertising wants to attribute purchases to impressions of the same user that occurred during the previous thirty minutes, allowing two hours of delay on mobile phones and ten minutes on purchases.",
        "reasoning": [
          "Apply specific watermarks to both event times and express user equality plus the interval impression ≤ purchase ≤ impression + thirty minutes.",
          "Estimate state with asymmetric tolerances and monitor keys of anomalously active users to detect skew.",
          "Test events on edges and a stopped source, checking when rows are cleared and how the global watermark progresses."
        ],
        "outcome": "Attribution retains only temporally possible candidates and produces reproducible matches without an unlimited state store."
      }
    },
    "keyPoints": [
      "Equality keys alone do not limit the state of a stream-stream join.",
      "The temporal range condition and watermarks work together.",
      "An outer join cannot declare a row without a match until the match possibility expires."
    ],
    "decisions": [
      "Equality keys alone do not limit the state of a stream-stream join.",
      "The temporal range condition and watermarks work together.",
      "An outer join cannot declare a row without a match until the match possibility expires."
    ],
    "example": {
      "title": "Temporary join of clicks and payments",
      "note": "Separately document the delay of each source and the maximum business interval between the two events."
    },
    "pitfalls": [
      "Add watermarks but omit the join time range, so the state still has no useful boundary.",
      "Expect an outer join to immediately cast unmatched ones, before the watermark expires."
    ],
    "examDecision": "When the state is increasing in a stream-stream join, it checks watermarks on both inputs and a bounded time condition before scaling compute.",
    "checkpoint": {
      "question": "Why does a left outer join delay unpaid rows?",
      "answer": "Because you must wait until the watermark shows that a valid payment can no longer arrive within the time interval."
    }
  },
  "m14-l5": {
    "summary": "State store metrics reveal whether the trade-off between lateness, cardinality, and capacity remains sustainable.",
    "explanation": [
      "`stateOperators` reports total and updated rows, memory used, and rows retired by watermark. Continuous growth after several horizons may indicate extreme cardinality cues, future timestamps, lack of effective watermark, or an unbounded join condition.",
      "The diagnosis must reproduce specific data: on time, duplicates, late within tolerance, too late and invalid timestamps. A recovery test restarts from the same checkpoint; changing access mode or state scheme during the experiment can introduce another variable."
    ],
    "deepDive": {
      "mentalModel": "The state store is a local, checkpointed incremental database that embodies the memory of aggregations, deduplications, and joins. Its size does not depend only on rows per second: it depends on the number of live keys, simultaneous windows, versions per key, accepted delay and speed with which the watermark allows evacuation. That's why a low-volume stream but millions of unique devices can be more difficult than a dense one with few keys. The metrics should be read as a balance sheet: updated rows come in, deleted rows go out, and the total retained reflects the status debt. Memory, commit latency and checkpoint size grow differently depending on the provider. RocksDB with changelog checkpointing can reduce checkpoint pressure and duration on stateful loads, but changing the state mechanism of an already started query may require a new checkpoint and rebuild.",
      "mechanics": [
        "During a microbatch, each stateful operator restores or opens a version of the store, performs reads and updates by key, and creates a new version consistent with the batch. The checkpoint preserves the metadata and changes necessary for recovery. `stateOperators` reports total, updated, and deleted rows, plus memory and custom provider metrics. If the watermark advances and `numRowsRemoved` always remains zero, there may be a mismarked column, an incompatible mode, or a condition that never allows the state to be closed.",
        "Tuning starts with semantics: reduce cardinality with correct keys, filter before the operator, shorten tolerance according to evidence and avoid unnecessary overlapping windows. Then partitioning and state provider are sized. Arbitrarily repartitioning can change distribution and recovery; The migration is tested with production copies. Changelog checkpointing reduces the need to upload full snapshots in each batch, in exchange for a rebuild that combines snapshot and changes. No option compensates for a conceptually unlimited state; that requirement should be redesigned or moved to a different durable table and incremental processing."
      ],
      "concepts": [
        {
          "term": "State store",
          "definition": "Operator versioned store that maintains keys and values needed between microbatches and participates in recovery.",
          "whyItMatters": "It is the main stability determinant for stateful operations and must be sized as part of the design, not at the end."
        },
        {
          "term": "Living Cardinality",
          "definition": "Number of keys and windows that cannot yet be deleted according to the operator's temporary policy.",
          "whyItMatters": "Predicts state size better than raw input throughput."
        },
        {
          "term": "Changelog checkpointing",
          "definition": "Strategy that persists state changes between periodic snapshots instead of loading a complete snapshot at each checkpoint.",
          "whyItMatters": "It can reduce checkpoint latency for large RocksDB states, but requires a compatible architecture and recovery decision."
        }
      ],
      "workedScenario": {
        "situation": "One counter per device processes few readings per minute, but the state store grows to hundreds of millions of keys and the checkpoints exceed the nightly SLA.",
        "reasoning": [
          "Correlate total and deleted rows with the watermark to confirm that inactive devices remain alive for too wide a tolerance.",
          "Review if the business needs state by indefinite device; move the current value to Delta and limit streaming aggregation to finite windows.",
          "Evaluate RocksDB with changelog checkpointing on a versioned query and measure recovery, latency and cost before cutover."
        ],
        "outcome": "The redesign limits live cardinality, preserves history in durable storage, and returns checkpoints and recovery to operable targets."
      }
    },
    "keyPoints": [
      "The number of state rows must be stabilized for a stationary load and a finite horizon.",
      "Future timestamps can push the watermark and cause silent losses of normal events.",
      "The global `max` policy favors latency and may discard data from the slower stream; `min` prioritizes security."
    ],
    "decisions": [
      "The number of state rows must be stabilized for a stationary load and a finite horizon.",
      "Future timestamps can push the watermark and cause silent losses of normal events.",
      "The global `max` policy favors latency and may discard data from the slower stream; `min` prioritizes security."
    ],
    "example": {
      "title": "Stateful Operator Summary",
      "note": "Save the time series; a single observation does not distinguish a large window from a logical state leak."
    },
    "pitfalls": [
      "Measure CPU usage only and skip rows/memory from the state.",
      "Switch to the `max` policy to hide a slow stream without explicitly accepting the resulting discards."
    ],
    "examDecision": "If the state grows without stabilizing, first validate event time, watermark, cardinality and temporal conditions; More memory only postpones failure.",
    "checkpoint": {
      "question": "Which pattern indicates that a watermark is not removing state as expected?",
      "answer": "With stable input, `numRowsTotal` and memory grow over many horizons while `numRowsRemoved` remains null or very low."
    }
  },
  "m15-l1": {
    "summary": "Kafka delivers binary logs with topic, partition, and offset metadata; deserializing the payload without losing that traceability is the first responsibility of the consumer.",
    "explanation": [
      "Kafka's DataFrame exposes `key`, `value`, `topic`, `partition`, `offset`, `timestamp` and headers. `key` and `value` arrive as bytes, so doing just `CAST(value AS STRING)` does not validate the contract. An explicit schema with `from_json` makes it possible to distinguish a corrupted row from a compatible evolution.",
      "Keeping `topic`, `partition` and `offset` in bronze allows you to investigate leaks, reconstruct a range, and demonstrate which message originated a row. The Kafka key also matters: the producer uses it to partition and preserve order within a partition, but Kafka does not offer global order between partitions."
    ],
    "deepDive": {
      "mentalModel": "Kafka does not deliver business objects; delivers records ordered within partitions, identified by topic, partition and offset, with key, value, headers and timestamps in binary representation. The consumer must first preserve that technical envelope and then deserialize the payload with a versioned contract. The offset is not a global identifier nor does it represent the order between partitions: it only advances within a specific partition. The key influences the partitioning of the producer and, therefore, which entities share order. Structured Streaming projects that metadata as columns and preserves your progress at the checkpoint. Removing them before validating makes it difficult to audit duplicates, rebuild a range, or locate a faulty producer. A robust architecture maintains a bronze layer with immutable bytes and metadata, adds parsing results and errors, and only promotes events that satisfy the contract to silver.",
      "mechanics": [
        "The connector creates one input partition per relevant Kafka partition and requests offset ranges for each microbatch. Spark receives binary `key` and `value` along with `topic`, `partition`, `offset`, `timestamp` and other metadata. Deserialization converts `value` using `from_json`, Avro or Protobuf and produces typed fields; a corrupt record structure or an explicit path captures failures. Preserving topic-partition-offset allows you to form a unique technical registry key and verify that a replay read exactly the intended range.",
        "The order by entity is only maintained if the producer uses a stable key that routes it to the same partition. Increasing partitions can redistribute future keys and does not create global order. Headers and version scheme help to choose the decoder without trying formats blindly. The Kafka timestamp can represent creation or ingestion depending on the broker's configuration and should not be automatically confused with the domain event time. The design also validates size, compression, and poison pills to prevent a single incompatible payload from continually stopping the batch."
      ],
      "concepts": [
        {
          "term": "Topic-partition-offset",
          "definition": "Unique coordinate of a record within the retention of a Kafka topic.",
          "whyItMatters": "It allows auditing, precise replay and technical deduplication without assuming a non-existent global offset."
        },
        {
          "term": "record key",
          "definition": "Bytes normally used by the producer to choose partition and group order of related entities.",
          "whyItMatters": "A stable key preserves order by entity and avoids hot partitions due to faulty strategies."
        },
        {
          "term": "Envelope",
          "definition": "Set of technical metadata and raw payload surrounding the business event.",
          "whyItMatters": "Keeping it in bronze makes contract errors diagnosable and makes it possible to decode again without rereading Kafka."
        }
      ],
      "workedScenario": {
        "situation": "A company receives account changes in twelve partitions; Some JSON messages fail after a new version and auditing requires reproducing exactly the affected ones.",
        "reasoning": [
          "Persist bronze key, value, headers, topic, partition, offset and timestamp before interpreting the payload.",
          "Choose the schema by version, send parsing errors with their Kafka coordinate to quarantine and promote only typed records.",
          "Build the replay with documented offset and partition ranges, without confusing the same offset number on different partitions."
        ],
        "outcome": "The incompatible update does not block healthy data and each failed event can be located, corrected and reprocessed with full traceability."
      }
    },
    "keyPoints": [
      "The offset is only unique within a topic-partition pair.",
      "The key directs partitioning and local order; It does not replace the payload business key.",
      "Bronze must retain Kafka metadata and the original payload or an auditable reference."
    ],
    "decisions": [
      "The offset is only unique within a topic-partition pair.",
      "The key directs partitioning and local order; It does not replace the payload business key.",
      "Bronze must retain Kafka metadata and the original payload or an auditable reference."
    ],
    "example": {
      "title": "Reading with preserved Kafka metadata",
      "note": "Do not register credentials in options or notebooks; Get endpoints and secrets from governed configuration."
    },
    "pitfalls": [
      "Treat `(offset)` as a global identifier and cause collisions between partitions.",
      "Discard metadata immediately, making it impossible to prove which message caused an error."
    ],
    "examDecision": "If the question requires traceability or selective replay, keep topic, partition and offset next to the payload before transforming.",
    "checkpoint": {
      "question": "What combination unambiguously identifies a Kafka position?",
      "answer": "Topic, partition and offset; the offset itself is repeated in other partitions and topics."
    }
  },
  "m15-l2": {
    "summary": "The subscription and offsets options only set the start of a new query; upon resumption, the checkpoint governs the position.",
    "explanation": [
      "`subscribe` chooses specific topics, `subscribePattern` uses a regular expression, and `assign` sets partitions. Exactly one must be configured. In streaming, `startingOffsets` is `latest` by default and is only queried if there is no previous progress; changing it later does not rewind a query with checkpoint.",
      "For a backfill, a separate checkpoint and destination or a batch read with explicit ranges are used, a production query is not blindly modified. `failOnDataLoss=false` allows you to continue when offsets no longer exist, but accepts a possible loss and must be accompanied by reconciliation; It is not a generic bug fix."
    ],
    "deepDive": {
      "mentalModel": "Kafka's initial position is decided once, when a query without a checkpoint is born. Afterwards, the checkpoint is the authority on offsets; changing `startingOffsets` does not rewind an existing query. This distinction avoids two common mistakes: believing that `latest` skips data on every restart or attempting a backfill by modifying options while reusing the same state. `subscribe` follows explicit topics, `assign` sets specific partitions, and `subscribePattern` discovers topics that match a pattern; each option changes the topology and must be governed. `earliest` processes what is still retained, not an unlimited history. If Kafka has removed offsets that the checkpoint needs, the decision between fail, skip, or rebuild affects completeness and should not be hidden. A reliable replay uses a separate query and destination with offset limits, leaving production continuity intact.",
      "mechanics": [
        "When starting without a checkpoint, the connector consults `startingOffsets` and resolves for each TopicPartition a specific number. In each microbatch it obtains the latest offsets, applies rate limits, processes the interval and registers its endings at the checkpoint. On reboot it reads those records first and continues from them, ignoring the initial preference. Newly discovered partitions need their own startup rule depending on the connector. If the topic, subscription mode or number of sources is changed, checkpoint compatibility is no longer guaranteed and usually requires a new query.",
        "Kafka retains by time or size, so a committed offset can disappear during a long stop. `failOnDataLoss` makes the gap visible; disabling it may allow you to continue but accepts bypass and requires a reconciliation policy. Limiting offsets per trigger softens load and sink, although it prolongs the backlog. For backfill, initial and final offsets are captured per partition, written to a staging table and reconciled by key. Altering offsets of the main query mixes retrieval and history correction, complicates exactly-once, and can duplicate effects."
      ],
      "concepts": [
        {
          "term": "Starting offsets",
          "definition": "Position used to initialize each partition only when there is no restorable progress at a checkpoint.",
          "whyItMatters": "Clarifies why changing `earliest` or `latest` does not modify an already started query."
        },
        {
          "term": "Subscription",
          "definition": "Rule that determines which topics and partitions form the source, using subscribe, pattern or explicit assignment.",
          "whyItMatters": "It is part of the identity of the query and determines discovery, permissions and retrieval compatibility."
        },
        {
          "term": "Kafka Retention",
          "definition": "Policy whereby the broker deletes old segments regardless of the consumer's progress.",
          "whyItMatters": "Defines the maximum window to recover backlog or replay directly from Kafka."
        }
      ],
      "workedScenario": {
        "situation": "A pipeline was stopped for ten days, but the topic retains seven; When restarting, the checkpoint requests offsets already eliminated and the device proposes to disable the loss detection.",
        "reasoning": [
          "Quantify the gap per partition and keep the fault visible, because continuing silently would violate completeness without knowing what is missing.",
          "Retrieve the interval from the original bronze or source layer in a separate query and reconcile it with business keys.",
          "Adjust retention and RTO so that future recoverable stops fit in the window, preserving the primary checkpoint as authority."
        ],
        "outcome": "Recovery documents and fills in the actual loss without feigning continuity, and future policy aligns broker retention with operational objectives."
      }
    },
    "keyPoints": [
      "A resumed query takes offsets from the checkpoint, not from `startingOffsets`.",
      "`earliest` in a new query can consume all retention and generate a considerable backlog.",
      "`failOnDataLoss=false` changes an integrity guarantee and requires an explicit operational decision."
    ],
    "decisions": [
      "A resumed query takes offsets from the checkpoint, not from `startingOffsets`.",
      "`earliest` in a new query can consume all retention and generate a considerable backlog.",
      "`failOnDataLoss=false` changes an integrity guarantee and requires an explicit operational decision."
    ],
    "example": {
      "title": "Controlled initial subscription",
      "note": "After the first commit, `startingOffsets` stops deciding the position; the checkpoint continues from the confirmed offsets."
    },
    "pitfalls": [
      "Change `startingOffsets` to `earliest` expecting an existing stream to reread its history.",
      "Disable `failOnDataLoss` to silence under-retention without measuring lost gap."
    ],
    "examDecision": "To pick up exactly where a query left off, preserve its checkpoint; to reprocess, isolate checkpoint and destination and define the range of offsets.",
    "checkpoint": {
      "question": "What happens if `startingOffsets` is changed in a query that keeps the same checkpoint?",
      "answer": "The query resumes from the checkpoint offsets; the initial option does not rewind existing progress."
    }
  },
  "m15-l3": {
    "summary": "An event contract separates deserialization, validation, and evolution so that incompatible messages do not stop or contaminate the valid flow.",
    "explanation": [
      "With JSON, an explicit `StructType` avoids microbatch inference and allows detection of `_corrupt_record` or null required fields. Avro or Protobuf with a schema registry offer stronger contracts, but still require a compatibility policy between producer and consumer.",
      "A robust pattern publishes the raw message in bronze, routes failures to quarantine with the reason, and only exposes columns typed in silver. Adding an optional field is usually supported; renaming or changing type requires a coordinated migration or multi-version read via a `schema_version` field."
    ],
    "deepDive": {
      "mentalModel": "An event contract defines how to convert bytes into a trusted fact and how that conversion will evolve. Includes format, version, required fields, types, semantics, compatibility and handling of unknown data. Parsing should not be mixed with business rules: first it is determined if the payload can be interpreted; Then it is validated if the fact is acceptable, and finally it is transformed. This separation prevents a new optional column from being mistaken for corruption or a negative amount from bringing down the decoder. In evolved schemas, adding an optional field with default value is usually supported; renaming, changing type, or reinterpreting units can break consumers even though the JSON is still valid. A bronze layer saves the original and the version; silver materializes a canonical scheme and an explainable quarantine. The goal is not to accept everything, but to make each compatibility decision explicit and reversible.",
      "mechanics": [
        "The consumer inspects a header, registry subject, or version field and selects the correct schema. Deserialization produces a typed structure and an error signal without necessarily throwing a global exception. Constraints then separate valid, unknown, and semantically invalid rows, preserving Kafka coordinates. A normalization function translates compatible versions to the canonical model: converts units, fills documented defaults, and prevents transport columns from contaminating the domain. Metrics by version and cause allow us to detect adoption and regressions.",
        "Backward compatibility allows a new consumer to read old events; forward allows an old one to tolerate new events within limits. A registry can apply structural rules, but it does not detect semantic changes such as changing from euros to cents. Deployments are sequenced: first tolerant consumers, then new producers, and finally withdrawal after maximum retention. Poison pills are isolated so that the same registration does not cause infinite retries. Reprocessing from bronze allows you to apply a corrected decoder without depending on Kafka to persist the message."
      ],
      "concepts": [
        {
          "term": "Backward Compatibility",
          "definition": "Ability of a new version of the reader to interpret data written with previous versions of the contract.",
          "whyItMatters": "Allows consumers to be deployed earlier or later without locking retained history."
        },
        {
          "term": "poison pill",
          "definition": "Record whose form or content deterministically causes repeated consumer failure.",
          "whyItMatters": "It must be isolated with evidence to prevent retries from converting a data error into pipeline unavailability."
        },
        {
          "term": "Canonical scheme",
          "definition": "Stable internal representation to which compatible external versions are normalized.",
          "whyItMatters": "Decouples producer evolution from all downstream transformations and simplifies tests."
        }
      ],
      "workedScenario": {
        "situation": "A producer changes `amount` from decimal in euros to integer in cents and adds `currency`; both messages are valid JSON and will coexist for a week.",
        "reasoning": [
          "Identify each version unambiguously and reject inference based solely on numerical type or chance presence of fields.",
          "Normalize both versions to decimal and explicit currency, preserving payload and version for auditing and regression testing.",
          "Deploy the dual reader first, monitor metrics by version, and remove the old decoder only after agreed upon retention and replay."
        ],
        "outcome": "The transition does not alter amounts or stop the flow; the silver model remains stable while the external contract evolves in an observable way."
      }
    },
    "keyPoints": [
      "The schema is validated before applying business rules.",
      "The quarantine preserves payload and Kafka coordinates for remediation.",
      "Evolution is negotiated between producer and consumer; It is not resolved by granting `string` types to everything."
    ],
    "decisions": [
      "The schema is validated before applying business rules.",
      "The quarantine preserves payload and Kafka coordinates for remediation.",
      "Evolution is negotiated between producer and consumer; It is not resolved by granting `string` types to everything."
    ],
    "example": {
      "title": "JSON deserialization with contract",
      "note": "Hold `payload` until the row has passed validation so you can diagnose and retry."
    },
    "pitfalls": [
      "Infer the schema on every run and accept accidental changes from the producer.",
      "Discard invalid messages without counter, payload or origin coordinates."
    ],
    "examDecision": "When faced with several formats or versions, it validates with an explicit contract and routes incompatible ones; Don't stop the entire topic because of one row or ignore it without evidence.",
    "checkpoint": {
      "question": "What minimum data does a Kafka quarantine need to reprocess a row?",
      "answer": "Original payload, rejection reason, timestamp and topic-partition-offset coordinates, in addition to the schema version when it exists."
    }
  },
  "m15-l4": {
    "summary": "Kafka, checkpoint, and Delta can offer exactly-once processing, but any external sink again requires end-to-end idempotency.",
    "explanation": [
      "Spark records offset ranges at the checkpoint and Delta confirms each microbatch transactionally. A failure can cause the engine to recalculate the batch, but the sink protocol prevents materializing it twice. This does not deduplicate two different messages that the producer published with the same `order_id`.",
      "When the target is an API, a non-transactional database, or multiple systems, `foreachBatch` offers at-least-once semantics unless the function is idempotent. A producer outbox, stable event IDs, and `MERGE` in silver solve different layers of the problem."
    ],
    "deepDive": {
      "mentalModel": "The Kafka–Spark–Delta journey can be approached exactly once because each component offers a durable identity: offsets per partition, commits per microbatch, and Delta transactions. However, this composition depends on not introducing a border that is unknown to the protocol. The checkpoint causes Spark to re-read a range when it was not committed; Delta can cause the repetition to converge to the same result if using the built-in sink or a deterministic `MERGE`. Partial attempts may be observed by an external API, another database, or two tables written sequentially. Therefore a single canonical output is designed and downstream effects are derived with independent consumers. Duplicate origin (two Kafka records with the same event) is also distinguished from technical retry (the same range executed again): the first requires a business key, the second coordination or idempotence of the sink.",
      "mechanics": [
        "Spark records for batch N the offset ranges of all partitions, calculates the transformations and writes to Delta. If the sink commit and progress are acknowledged, the next batch advances. If the process fails on an ambiguous boundary, the batch can be repeated; the Delta transaction or the `MERGE` must recognize the logical identity and not add another copy. The composite offset serves for traceability, but a reconstruction from another source or checkpoint changes technical identities, so the business key is still necessary.",
        "With `foreachBatch`, an upsert can be idempotent if within the batch there is at most one final decision per key and the sequence resolves conflicts. Writing to a fact table and then calling a service creates two independent commits. The outbox pattern materializes in Delta both the state and a pending effect row; another stream publishes and marks result with idempotency key. Latency increases and there is additional uptime, but you gain recovery, auditing, and the ability to repair a single consumer without rewinding Kafka."
      ],
      "concepts": [
        {
          "term": "Technical identity",
          "definition": "Transport coordinate, such as topic-partition-offset or batch id, that identifies an attempt within a run.",
          "whyItMatters": "Allows retries to be tracked, but does not replace a business identity between rebuilds."
        },
        {
          "term": "Outbox",
          "definition": "Transactional table of pending effects written alongside the canonical state and consumed independently.",
          "whyItMatters": "Avoids attempting a distributed transaction with external APIs and makes partial publications repairable."
        },
        {
          "term": "Convergence",
          "definition": "Property by which re-executing data leads to the same final state despite repeated or disordered attempts.",
          "whyItMatters": "It is a practical and testable correctness formulation for recoverable pipelines."
        }
      ],
      "workedScenario": {
        "situation": "A transfer stream updates balances in Delta and must send each operation to an anti-fraud system that only offers an HTTP API.",
        "reasoning": [
          "Confirm balances and an outbox row in the Delta plane using a deterministic transformation by `transfer_id`.",
          "Create a separate consumer that uses `transfer_id` as the HTTP idempotency key and logs response, attempts, and final error.",
          "Test crashes before and after each commit, demonstrating that the state converges and that a fix does not reapply the balance."
        ],
        "outcome": "The route preserves exactly a logical balance decision and a recoverable external delivery, without attributing to the checkpoint an atomicity that HTTP does not offer."
      }
    },
    "keyPoints": [
      "Exactly-once processing does not remove duplicates created by the producer.",
      "A checkpoint cannot undo an external effect already committed outside of Spark.",
      "The `event_id` key allows business deduplication in addition to technical offset coordination."
    ],
    "decisions": [
      "Exactly-once processing does not remove duplicates created by the producer.",
      "A checkpoint cannot undo an external effect already committed outside of Spark.",
      "The `event_id` key allows business deduplication in addition to technical offset coordination."
    ],
    "example": {
      "title": "Deduplicated Kafka event upsert",
      "note": "Before `MERGE`, keep a single winning row per `order_id` within the microbatch to avoid multiple matches."
    },
    "pitfalls": [
      "Promise exactly-once because Kafka uses offsets, even though the sink is an idempotent keyless API.",
      "Confusing re-execution of the same offset with two different messages sent by the producer."
    ],
    "examDecision": "Evaluate guarantees of each border. For an integrated Delta destination, use checkpoint; for external effects, add an idempotent operation or a ledger.",
    "checkpoint": {
      "question": "Can checkpoint delete a duplicate charge already created in an external API?",
      "answer": "No. The API must accept an idempotent key or the pipeline must log transactions so that retry does not repeat the effect."
    }
  },
  "m15-l5": {
    "summary": "Partitions, offset limits and lag metrics allow you to regulate throughput without confusing a temporary protection with a capacity solution.",
    "explanation": [
      "Maximum read parallelism is limited by Kafka partitions, although Spark can split large ranges into more tasks based on source capabilities. `maxOffsetsPerTrigger` limits the volume of a microbatch and protects the sink during recovery, but if it falls below the arrival rate the lag will grow indefinitely.",
      "The metrics `avgOffsetsBehindLatest`, `maxOffsetsBehindLatest` and estimated bytes show delay by source. They must be correlated with trigger duration, partition distribution and processing rates. A single hot partition can dominate the SLA even if the average looks healthy."
    ],
    "deepDive": {
      "mentalModel": "Kafka's throughput is initially bounded by its partitions: one partition provides an ordered stream that a task consumes by range of offsets, while multiple partitions allow parallelism. More partitions do not guarantee balance if the key concentrates traffic, and more workers than partitions do not create useful readers. Structured Streaming can limit offsets per trigger to protect memory, state or sink during spikes. That limit regulates admission; does not increase sustained capacity. If the average arrival exceeds the average process, the lag will continue to grow even if the batches are small. The operational objective is to maintain headroom, detect skew per partition and estimate backlog emptying time. Changing partitioning also affects order by entity and may require coordination with producers, it is not just a consumer option.",
      "mechanics": [
        "On each trigger, the connector obtains latest offsets by TopicPartition and calculates the new range from the checkpoint. A global limit is distributed proportionally between partitions according to backlog, subject to configurable minimums. Each range is processed in Spark tasks; the duration is set by the slowest partition and downstream transformations. The initial, final and last available offset metrics allow you to calculate lag per partition. A hot partition appears as a persistent queue even though the aggregated total appears acceptable.",
        "Increasing `maxOffsetsPerTrigger` reduces recovery time if compute and sink have margin, but can create microbatches that exceed SLA or trigger state and spill. Reducing it stabilizes peaks and shares capacity, but lengthens the backlog. Scaling workers helps up to available parallelism and shuffles; Afterwards, keying must be corrected or partitions expanded. Repartitioning within Spark balances subsequent transformations, but does not change the speed with which an individual Kafka partition surrenders its rank or rebuilds the lost order."
      ],
      "concepts": [
        {
          "term": "consumer lag",
          "definition": "Difference per partition between the last offset available in Kafka and the offset confirmed by the query.",
          "whyItMatters": "It measures real backlog and allows you to estimate whether freshness is recovered or deteriorates."
        },
        {
          "term": "hot partition",
          "definition": "Partition that receives or processes much more load than the others due to skewed key distribution.",
          "whyItMatters": "It limits the entire batch and is not solved by simply adding workers or using a global average."
        },
        {
          "term": "Admission control",
          "definition": "Deliberate limit on how many offsets go into a microbatch.",
          "whyItMatters": "Protects downstream during bursts, but must be distinguished from a permanent capacity improvement."
        }
      ],
      "workedScenario": {
        "situation": "After a campaign, one of twenty partitions accumulates millions of events because all anonymous clients use the same key; The equipment lowers offsets per batch to stabilize the sink.",
        "reasoning": [
          "Measure lag per partition and confirm that the duration is dominated by the anonymous key, not by a uniform lack of workers.",
          "Maintain a time limit that protects the sink while the producer distributes anonymous keys with a stable key of higher cardinality.",
          "Size partitions and compute with the new distribution, checking that the sustained rate exceeds the arrival by margin and preserves order where it matters."
        ],
        "outcome": "The limit prevents immediate collapse and the correction of the partitioning eliminates the structural cause, allowing the lag to be emptied without violating the order-by-entity contract."
      }
    },
    "keyPoints": [
      "`maxOffsetsPerTrigger` controls batch, does not increase capacity.",
      "The producer key can create persistent skew between partitions.",
      "Measures maximum lag and per partition, in addition to the average."
    ],
    "decisions": [
      "`maxOffsetsPerTrigger` controls batch, does not increase capacity.",
      "The producer key can create persistent skew between partitions.",
      "Measures maximum lag and per partition, in addition to the average."
    ],
    "example": {
      "title": "Removing lag from progress",
      "note": "Alert by trend and estimated recovery time, not by an isolated value during an expected peak."
    },
    "pitfalls": [
      "Reduce the batch until the duration stabilizes while the backlog silently grows.",
      "Add workers when the topic has a single hot partition and does not offer useful parallelism."
    ],
    "examDecision": "If the lag increases, compare arrival rate, limit per trigger, partitions and sink neck; adjusts the limit for stability and the ability to converge.",
    "checkpoint": {
      "question": "Why can too low a `maxOffsetsPerTrigger` breach the SLA even though each batch finishes fast?",
      "answer": "Because it admits fewer events per unit of time than those that arrive and the backlog increases despite short microbatches."
    }
  },
  "m16-l1": {
    "summary": "Delta Change Data Feed exposes committed changes of a table along with its type, version, and commit timestamp for incremental consumption.",
    "explanation": [
      "By enabling `delta.enableChangeDataFeed`, future versions can be read with `readChangeFeed=true`. The output includes `_change_type`, `_commit_version` and `_commit_timestamp`; updates generate previous and subsequent images. CDF does not rebuild changes prior to its activation.",
      "The available history depends on table retention and `VACUUM`. A consumer that remains down beyond the horizon may not recover old versions. That is why the recovery SLA must relate retention, maximum unavailability and a snapshot alternative."
    ],
    "deepDive": {
      "mentalModel": "Change Data Feed converts the transactional history of a table into an incremental interface of changes per row. Instead of comparing full snapshots, the consumer requests versions and receives inserts, deletes, and, for updates, previous and subsequent images along with version and commit timestamp. The important boundary is the commit Delta: all changes in a transaction share a version, even if their order of rows within it is not a business sequence. CDF facilitates replication, auditing, and incremental ETL, but is not a permanent, independent copy of history; Its availability depends on table retention and applicable policies. In 2026 Databricks distinguishes the automatic change data feed, calculated by reading via row lineage when supported, and the legacy materialized during writes. Both are consumed with the documented APIs, but their prerequisites and operational costs must be checked.",
      "mechanics": [
        "A batch read uses `table_changes` or the `readChangeFeed` options with initial and optionally final version or timestamp. A streaming read first takes an initial snapshot as inserts by default and then issues new commits, preserving the atomicity of each version with respect to rate limits. The `_change_type`, `_commit_version` and `_commit_timestamp` columns accompany the business columns. An update produces `update_preimage` and `update_postimage`; the consumer chooses whether they need to audit both or apply only the later state. The checkpoint records which commit the query advanced up to.",
        "Activating legacy CDF only records post-activation changes; does not rebuild previous versions. Cleaning logs and files can make an old range no longer readable, so a consumer with a long RTO needs a durable bronze table or aligned retention. The commit version is a total order of transactions within the table, not necessarily the causal order originating in another system. To replicate deletes and updates, the key is preserved and an application sequence is defined, avoiding treating each preimage as a new business row."
      ],
      "concepts": [
        {
          "term": "Change Data Feed",
          "definition": "Interface that exposes committed row changes between versions of a table with type and commit metadata.",
          "whyItMatters": "Allows incremental processing without scanning and comparing entire snapshots on each run."
        },
        {
          "term": "Commit version",
          "definition": "Monotonic number that identifies a Delta transaction within the history of a table.",
          "whyItMatters": "It serves as a reproducible boundary for checkpoints and replays, but does not replace the source business sequence."
        },
        {
          "term": "Preimage/Postimage",
          "definition": "Before and after values that CDF can output for an updated row.",
          "whyItMatters": "Distinguishing them avoids duplicating entities and allows you to choose between full audit and current status application."
        }
      ],
      "workedScenario": {
        "situation": "A computer replicates clients from a Delta table to a search index and needs to recover after eight days without rereading 500 million rows.",
        "reasoning": [
          "Verify that the CDF modality and withholding cover the RTO, and persist changes in bronze if the consumer may be left outside that window.",
          "Read from the last committed version, apply postimages and inserts by key, and translate deletes to idempotent deletes from the index.",
          "Register the published Delta version only after committing the external batch, maintaining an idempotent key for ambiguous retries."
        ],
        "outcome": "Replica progresses by traceable commits and can resume without a full snapshot, with an explicitly governed retention and external boundary."
      }
    },
    "keyPoints": [
      "CDF is enabled before the changes you want to capture.",
      "`update_preimage` and `update_postimage` represent two views of the same update.",
      "The commit version orders Delta changes; The timestamp helps auditing, but does not replace the source stream."
    ],
    "decisions": [
      "CDF is enabled before the changes you want to capture.",
      "`update_preimage` and `update_postimage` represent two views of the same update.",
      "The commit version orders Delta changes; The timestamp helps auditing, but does not replace the source stream."
    ],
    "example": {
      "title": "Incremental read from Change Data Feed",
      "note": "In a new stream you can set `startingVersion`; upon resuming, the checkpoint retains the position."
    },
    "pitfalls": [
      "Expect enabling CDF to retroactively generate changes from previous versions.",
      "Consume preimages and postimages as two independent updates and duplicate effects."
    ],
    "examDecision": "Use CDF when the source is already Delta and you need row-by-row changes; If there are missing versions due to retention, rebuild from snapshot instead of inventing offsets.",
    "checkpoint": {
      "question": "What exchange rates are typically retained to materialize the current state?",
      "answer": "`insert`, `update_postimage` and `delete`; `update_preimage` is for auditing or comparisons, not new state."
    }
  },
  "m16-l2": {
    "summary": "A CDC feed is only deterministic if it defines keys, a total sequence per key, and explicit semantics for deletes and null values.",
    "explanation": [
      "The arrival time is not a reliable sequence: an old update can arrive after a new one. `SEQUENCE BY` must use an LSN, version number, or other monotonic column from the source. If there are ties, a `struct` with tie-breaking fields produces a stable lexicographic order.",
      "The pipeline must also decide whether a `NULL` deletes the value or means 'field not sent', and how to identify deletions. The key should not change silently; A key modification is usually modeled as a delete of the old key and an insert of the new key."
    ],
    "deepDive": {
      "mentalModel": "A CDC feed describes transitions, not independent rows. Reconstructing an entity requires a stable key, an operation, and a total sequence per key. The arrival timestamp is usually not enough: two updates can traverse partitions or retries and appear out of order. The sequence must come from the source log—LSN, SCN, version, or a composite structure—and resolve ties deterministically. Deletes must be represented explicitly, and nulls require semantics: they can mean setting null or simply missing field in a partial update. Before applying changes, the contract is validated, resubmissions are deduplicated and the raw feed is preserved. A mutable key is treated as delete plus insert or by a separate immutable identity. This model allows demonstrating the final state before replay and is a conceptual requirement for both a manual MERGE and AUTO CDC.",
      "mechanics": [
        "The pipeline logically groups changes by key and orders them using `sequence_by`. For the same sequence, you need additional criteria or you must reject ambiguity; a structure with timestamp, counter and offset can form total order. An insert or update creates the subsequent state, a delete removes or closes the entity, and a truncate—if supported—has global scope. In partial updates, the engine must distinguish the field's absence from an intended null value. The result is published only after resolving multiple events of the same key within the range.",
        "Late events are still applicable if your sequence places them before the current state and the engine maintains the necessary information, but incorrect retention or layout can lose context. Sorting by ingestion time causes a different replay to produce a different result. Duplicates with the same operation and sequence should be idempotent; Conflicts with different payloads should be excluded because they hide a violation by the producer. For SCD2, the sequence defines validity boundaries and any ambiguity generates overlapping or negative intervals, so it is tested with out-of-order cases and deletes."
      ],
      "concepts": [
        {
          "term": "Total sequence by key",
          "definition": "Deterministic order that allows any pair of changes of the same entity to be compared, including ties.",
          "whyItMatters": "Makes the reconstructed state identical in normal execution, retry, and replay."
        },
        {
          "term": "tombstone",
          "definition": "Event that represents the logical deletion of a key without depending on the row physically disappearing from the feed.",
          "whyItMatters": "It allows propagating deletes and closing history instead of leaving obsolete entities downstream."
        },
        {
          "term": "Partial update",
          "definition": "Change that specifies only some attributes and leaves the rest unchanged.",
          "whyItMatters": "Forces you to distinguish null from an absent field to avoid accidentally deleting data when applying CDC."
        }
      ],
      "workedScenario": {
        "situation": "A customer log issues two changes with the same second, one for address and the other for consent; they arrive inverted and the second omits unmodified fields.",
        "reasoning": [
          "Build `sequence_by` with LSN and operation counter, not ingestion timestamp or just seconds precision.",
          "Preserve partial update semantics, so that omitted fields do not replace current values with null.",
          "Reproduce events in different physical orders and require the same status and intervals before approving the contract."
        ],
        "outcome": "The final state and history are deterministic even if the order of arrival changes, and truly ambiguous conflicts remain visible."
      }
    },
    "keyPoints": [
      "The sequence is evaluated by key and must resolve out-of-order events.",
      "`APPLY AS DELETE WHEN` converts a feed condition into logical deletion of the target.",
      "`IGNORE NULL UPDATES` is only correct when nulls mean no change."
    ],
    "decisions": [
      "The sequence is evaluated by key and must resolve out-of-order events.",
      "`APPLY AS DELETE WHEN` converts a feed condition into logical deletion of the target.",
      "`IGNORE NULL UPDATES` is only correct when nulls mean no change."
    ],
    "example": {
      "title": "Composite order for CDC",
      "note": "The first field of the struct must represent the authoritative order of the origin; The timestamp only breaks ties if its quality is guaranteed."
    },
    "pitfalls": [
      "Sort by `current_timestamp()` and allow the latest arriving event to overwrite the newest one from the source.",
      "Enable `IGNORE NULL UPDATES` when a null actually represents an attribute deletion."
    ],
    "examDecision": "When CDC is out of order, it chooses a monotonic sequence from the source system; adding more compute does not fix selecting the wrong version.",
    "checkpoint": {
      "question": "Why is an ingest timestamp not a good `SEQUENCE BY`?",
      "answer": "Because it orders by arrival, not by the origin commit; a delayed old change could defeat a newer one."
    }
  },
  "m16-l3": {
    "summary": "AUTO CDC is the current name for the pipeline APIs that replace APPLY CHANGES and automate sorting, deduplication, deletes and SCD.",
    "explanation": [
      "In SQL, a streaming table target and a flow `AUTO CDC INTO` are declared. In Python, the equivalent API of Spark Declarative Pipelines in Lakeflow is used. The source must be streaming and the key, sequence and deletion rules remain in the declarative definition.",
      "`APPLY CHANGES` is still available for compatibility and shares syntax, but Databricks recommends AUTO CDC. The current name must appear in documentation, new code, and design responses; mentioning APPLY CHANGES only clarifies a previous configuration or migration."
    ],
    "deepDive": {
      "mentalModel": "AUTO CDC is the current Lakeflow pipelines API for converting a change feed to an SCD table without manually implementing sorting, deduplication, and enforcement. Replaces the previous name `APPLY CHANGES`; The old APIs are still available, but the documentation recommends `AUTO CDC`. In Python, a destination streaming table is declared and a flow is created with `dp.create_auto_cdc_flow`; in SQL you use `AUTO CDC INTO`. The author provides keys, `sequence_by`, delete rules, treatment of nulls, columns and SCD type. The service deals with out-of-order events within its semantics, but does not invent a correct contract: an ambiguous sequence or unstable key still produces a faulty model. It is also worth distinguishing Lakeflow pipelines, which extends the declarative framework with managed capabilities, from the Apache Spark Declarative Pipelines project; AUTO CDC is a Lakeflow Databricks capability, not an Apache core portable API.",
      "mechanics": [
        "First, the target streaming table is created, because the flow manages how changes arrive at that table. `keys` defines identity, `sequence_by` sorts each key, and `apply_as_deletes` translates a feed condition to deletion. `stored_as_scd_type` select type 1 or 2; Column lists control projection and history. When manually declaring an SCD2 schema, the technical columns `__START_AT` and `__END_AT` must use the same type as the sequence. The engine saves enough state to reorder and apply changes incrementally.",
        "`ignore_null_updates` is appropriate only if null means absent attribute; activating it when null is a business value would prevent deleting an attribute. A delete can be temporarily preserved to absorb late changes and then physically disappear depending on configuration. Changing keys, sequence, or SCD type on an active table is not a cosmetic adjustment: it alters state and history and requires tested migration. Although the APPLY CHANGES syntax is equivalent, new material and design questions should use AUTO CDC and recognize the old name only when interpreting legacy code."
      ],
      "concepts": [
        {
          "term": "AUTO CDC",
          "definition": "Lakeflow pipelines managed API that applies an ordered change feed to a type 1 or 2 SCD table.",
          "whyItMatters": "Reduces error-prone manual logic and is the current terminology recommended by Databricks."
        },
        {
          "term": "sequence_by",
          "definition": "Scalar or structured expression that establishes the order of changes for each key in the flow.",
          "whyItMatters": "It governs the resolution of late events and the correct construction of state and intervals."
        },
        {
          "term": "apply_as_deletes",
          "definition": "Condition that identifies which records in the feed represent deletions of the target entity.",
          "whyItMatters": "Without it, a tombstone could be treated as an upsert and leave behind data that the source has already deleted."
        }
      ],
      "workedScenario": {
        "situation": "A company migrates an `APPLY CHANGES` pipeline of clients with unordered deletes and events, and wants to update names without altering the existing SCD2 table.",
        "reasoning": [
          "Compare the current signature and confirm that `create_auto_cdc_flow` maintains keys, sequence, delete rules and SCD type of the previous flow.",
          "Update the name on a branch and run controlled replay against an isolated target, comparing ranges and active rows key by key.",
          "Deploy preserving checkpoint and state only if the modification is nominal and compatible; any semantic changes are treated as separate migration."
        ],
        "outcome": "The code adopts the current API without turning a rename into an accidental redesign, and the equivalence of the result is tested with out-of-order data."
      }
    },
    "keyPoints": [
      "AUTO CDC replaces APPLY CHANGES with the same purpose and equivalent syntax.",
      "The target of an AUTO CDC flow is a streaming table.",
      "The declaration does not eliminate the need to validate keys, sequence, deletes, and retention."
    ],
    "decisions": [
      "AUTO CDC replaces APPLY CHANGES with the same purpose and equivalent syntax.",
      "The target of an AUTO CDC flow is a streaming table.",
      "The declaration does not eliminate the need to validate keys, sequence, deletes, and retention."
    ],
    "example": {
      "title": "AUTO CDC SCD type 1",
      "note": "`APPLY CHANGES INTO` is the previous name. For new deployments use `AUTO CDC INTO`."
    },
    "pitfalls": [
      "Copy old examples and introduce APPLY CHANGES as the current recommended API.",
      "Omit authoritative `SEQUENCE BY` and assume the pipeline can infer the correct order."
    ],
    "examDecision": "To apply a CDC feed in Lakeflow pipelines, choose AUTO CDC; uses SCD 1 or 2 depending on whether the consumer needs current state or history.",
    "checkpoint": {
      "question": "What is the relationship between AUTO CDC and APPLY CHANGES?",
      "answer": "AUTO CDC replaces and is the recommended name for APIs formerly called APPLY CHANGES; the previous ones are still available for compatibility."
    }
  },
  "m16-l4": {
    "summary": "SCD type 1 retains the current value; SCD type 2 creates validity intervals to answer what a dimension was like at a past time.",
    "explanation": [
      "Type 1 overwrites attributes and is appropriate for fixes where the story does not add value. Type 2 preserves versions with start and end columns managed by the pipeline. Queries for historical facts can match the event time of the fact with the interval of the dimension.",
      "Saving history multiplies rows and requires deciding which columns trigger a new version. `TRACK HISTORY ON` can limit that set in AUTO CDC. Operational fields like `ingested_at` should not create a business version every time it changes."
    ],
    "deepDive": {
      "mentalModel": "SCD type 1 and type 2 answer different questions. Type 1 represents the current best version of each key and overwrites attributes; It is compact and simple, but it cannot answer what value was known before. Type 2 maintains one row per validity period, usually with technical start and end boundaries, and allows temporary queries. Not every change deserves history: correcting a technical typo may not require a new version, while address, segment or consent may affect facts and auditing. The CDC sequence defines when each release starts, not when Databricks processed it. Deletes can close the active range or remove the current row depending on the type. The modeler must separate business effective time from system processing time; a standard sequence-based SCD2 is neither automatically bitemporal nor preserves when a correction was discovered.",
      "mechanics": [
        "In type 1, each valid change is compared by key and sequence with the known state; the most recent updates chosen columns and a delete removes the active version. In type 2, the engine inserts a new row, opens its `__START_AT` and closes `__END_AT` of the previous one. A late event may force an intermediate version to be inserted and adjacent boundaries adjusted. As-of queries select the interval that contains the instant, taking care of the inclusive/exclusive convention to avoid duplicating edges.",
        "Type 2 multiplies storage, joins, and fix complexity, especially with attributes that change frequently. Tracking only relevant business columns avoids releases for irrelevant operational changes. Surrogate keys can stabilize joins, but the natural key is still necessary to enforce CDC. In fact models, resolving the as-of dimension during loading preserves historical context; always join with the current row destroys that semantics. Replays must validate that there is at most one active interval and that there are no overlaps per key."
      ],
      "concepts": [
        {
          "term": "SCD type 1",
          "definition": "Model that maintains a single current row per key and replaces attributes with the most recent change.",
          "whyItMatters": "It is appropriate when only the current state matters and minimizes cost and complexity."
        },
        {
          "term": "SCD type 2",
          "definition": "Model that preserves multiple versions per key with non-overlapping validity intervals.",
          "whyItMatters": "Allows as-of analysis and auditing of attributes whose historical value affects decisions."
        },
        {
          "term": "Validity interval",
          "definition": "Time range during which a dimension version is considered effective.",
          "whyItMatters": "It is the basis for correct temporal joins and for detecting history gaps or overlaps."
        }
      ],
      "workedScenario": {
        "situation": "Risk needs to know the country of residence a client had when each loan was approved, while support only needs the current phone number.",
        "reasoning": [
          "Classify country as a historical attribute and telephone as current, avoiding generating SCD2 versions for each contact correction irrelevant to risk.",
          "Configure history only for regulated columns and use the origin sequence as the interval boundary.",
          "Enrich credits by joining as-of with the residence interval and validating a single applicable version per client and moment."
        ],
        "outcome": "The model preserves regulatory evidence where it matters and keeps operational attributes compact, without confusing current state with historical context."
      }
    },
    "keyPoints": [
      "SCD 1 answers 'what is the current value'; SCD 2 also answers 'what was it then'.",
      "The sequence determines intervals; should not be confused with the upload date.",
      "The set of historical columns controls noise and storage cost."
    ],
    "decisions": [
      "SCD 1 answers 'what is the current value'; SCD 2 also answers 'what was it then'.",
      "The sequence determines intervals; should not be confused with the upload date.",
      "The set of historical columns controls noise and storage cost."
    ],
    "example": {
      "title": "AUTO CDC SCD type 2 selective",
      "note": "Check the names of the control columns exposed by the target before designing point-in-time queries."
    },
    "pitfalls": [
      "Use SCD 2 for each technical attribute and generate versions without analytical value.",
      "Overwrite with SCD 1 when auditing or historical reporting requires the value in effect when the event occurred."
    ],
    "examDecision": "If the requirement contains 'current state', SCD 1 is usually sufficient; If it asks for auditing or point-in-time historical joins, choose SCD 2.",
    "checkpoint": {
      "question": "What problem does `TRACK HISTORY ON` prevent on an SCD 2 target?",
      "answer": "Avoid opening a historical version for changes to irrelevant columns and limit the history to selected business attributes."
    }
  },
  "m16-l5": {
    "summary": "AUTO CDC FROM SNAPSHOT processes ordered snapshots when the source does not provide a change log, but you need a reliable version and complete coverage.",
    "explanation": [
      "Some bases deliver a full extraction daily. Comparing snapshots allows you to infer inserts, updates and deletes, and the AUTO CDC FROM SNAPSHOT APIs automate that materialization. Each snapshot must have a strictly increasing version and represent the complete set expected.",
      "A partial extraction confused with a full snapshot would produce massive deletions. Counts, partitions, and completion markers are validated before publishing. If the source does offer continuous CDC, normal AUTO CDC avoids comparing the entire dimension and reduces latency."
    ],
    "deepDive": {
      "mentalModel": "AUTO CDC FROM SNAPSHOT resolves sources that do not expose change logs: compares consecutive full snapshots, derives synthetic inserts, updates and deletes and applies the same SCD logic. It does not recover transitions that occurred and were reversed between two captures; it only knows the observable differences between states. The current API is available in the Lakeflow pipelines Python interface and requires snapshots in ascending order using a trusted version. A snapshot must be complete and consistent for its version; If it arrives truncated, the comparator can interpret thousands of absences as legitimate deletes. Therefore, the acquisition first publishes a manifest with counts, checksum, extraction time and complete status. Out-of-order snapshots are ignored according to documented semantics, so the release cannot be derived from an arrival time susceptible to delays.",
      "mechanics": [
        "The provider function delivers the following DataFrame snapshot along with a monotonic version. The engine keeps reference to the previous state, compares by keys and generates a synthetic feed: new keys are inserts, absent ones are deletes and different attributes are updates. That feed feeds SCD1 or SCD2 processing. The first version lays the foundation; each subsequent version must represent the entire agreed upon population. The technical state and target table allow you to continue incrementally without the author manually writing a full diff.",
        "Comparing large snapshots consumes read and compute, although the incremental result reduces downstream work. Partitioning the extract or receiving chunks is not equivalent to a full snapshot unless the contract describes how to assemble them before publishing. A daily version omits two intraday changes and is not suitable for auditing each transition. Before accepting mass deletes, counts and completeness are validated; A cut-off circuit can stop the application and maintain the last good state. If an old snapshot appears after a new one, it is audited as a failure instead of being renumbered."
      ],
      "concepts": [
        {
          "term": "Full Snapshot",
          "definition": "Consistent image of all keys in scope for a particular version of the font.",
          "whyItMatters": "Absences are interpreted as deletes, so incompleteness can cause massive downstream loss."
        },
        {
          "term": "Snapshot version",
          "definition": "Monotonic and stable identifier that orders images by their logical extraction sequence.",
          "whyItMatters": "It allows you to compare correct pairs and avoids applying a delayed delivery as if it were the newest state."
        },
        {
          "term": "synthetic shifting",
          "definition": "Insert, update or delete inferred when comparing two snapshots, not issued directly by the source system.",
          "whyItMatters": "It provides incrementality, but cannot reveal invisible intermediate transitions between captures."
        }
      ],
      "workedScenario": {
        "situation": "An ERP exports five million suppliers every night; an interrupted transfer produces a file with only 60% and arrives before the control manifest.",
        "reasoning": [
          "Do not publish the version until validating manifest, count, checksum and extraction mark complete against historical limits.",
          "Deliver snapshots to the flow through a monotonic ERP version, without using the file arrival timestamp as an order.",
          "Block an abnormal cardinality drop and preserve the last good version, retrying the extraction before inferring deletes."
        ],
        "outcome": "The pipeline gains CDC benefits without converting a partial export into a bulk delete and explicitly recognizes the loss of intraday changes."
      }
    },
    "keyPoints": [
      "Snapshot CDC is useful when there is no reliable change feed.",
      "The snapshot version must order deliveries and not be reused.",
      "Completeness is checked before interpreting absences as deletes."
    ],
    "decisions": [
      "Snapshot CDC is useful when there is no reliable change feed.",
      "The snapshot version must order deliveries and not be reused.",
      "Completeness is checked before interpreting absences as deletes."
    ],
    "example": {
      "title": "Minimum contract for a snapshot",
      "note": "The function that delivers snapshots to AUTO CDC should sort versions and return `None` when a new one is not available."
    },
    "pitfalls": [
      "Interpret a partition missing due to extract failure as deleting all of its clients.",
      "Process snapshots out of order and reopen an old version as if it were new."
    ],
    "examDecision": "If the source only delivers full images, use AUTO CDC FROM SNAPSHOT with version and completeness validation; Don't make a row-by-row feed without an authoritative basis.",
    "checkpoint": {
      "question": "What validation prevents false deletes when comparing snapshots?",
      "answer": "Confirm via manifest/counts that the snapshot is complete before interpreting missing rows as deleted."
    }
  },
  "m17-l1": {
    "summary": "A streaming SLA must translate into measurable indicators of freshness, completeness, correctness and availability, with explicit windows and owners.",
    "explanation": [
      "Saying 'real time' does not allow for design or operation. A useful SLO may require that the p95 of `published_at - event_ts` be less than five minutes and that at least 99.5% of valid events appear within fifteen minutes. Completeness is reconciled with an authoritative source, not with the stream still being active.",
      "Each indicator needs a measurement source, period and error budget. A ten-minute watermark does not by itself guarantee ten minutes of freshness: the backlog, the trigger and the sink also count. The architecture is validated against SLOs, not the other way around."
    ],
    "deepDive": {
      "mentalModel": "A streaming SLA is not the phrase real time; It is a quantified contract between producer, platform and consumer. It is decomposed into indicators: freshness of the published event, completeness with respect to the source, correctness of rules, reading availability and recovery time. Each indicator needs a method, window, percentile, error budget and owner. Freshness can be measured as clock minus maximum valid event time, while microbatch latency is just an internal component. A five-minute p95 allows for occasional queues that a strict maximum would not allow. RPO expresses how much data could be lost and RTO how much it takes to restore service; checkpoints and replay must demonstrate both. The contract also defines degraded behavior: if Kafka is late, it may be better to serve data marked stale than to lock a consistent and available table.",
      "mechanics": [
        "The instrumentation captures event time, ingestion time, commit time and moment of availability to the consumer. From these marks, latency per stage and end-to-end is derived. Counts or checksums per window compare font, bronze and silver for completeness; Expectations and reconciliations measure correctness. The indicators are aggregated with percentiles and moving windows, preventing averages from hiding tails. The error budget allows you to prioritize reliability over changes: a sustained violation triggers the runbook and an isolated one can consume budget without declaring a total incident.",
        "The SLA must be achievable under nominal volume and defined peaks. Reducing freshness requires resident compute, more headroom, lower state, or lower lateness tolerance, each with cost or loss of correctness. A watermark is not in itself an arrival SLA: it expresses when to stop waiting within the operator. For completeness, what happens with data after that boundary is documented. RTO is tested by restoring checkpoint or rebuilding from bronze; if it takes longer than Kafka retention, the promised RPO is not physically possible."
      ],
      "concepts": [
        {
          "term": "SLI",
          "definition": "Concrete measure of observed behavior, such as p95 freshness or percentage of events reconciled.",
          "whyItMatters": "Turn ambiguous expectations into data that can be alerted and improved."
        },
        {
          "term": "ONLY",
          "definition": "Internal target for an SLI during a window, typically stricter than the external contractual limit.",
          "whyItMatters": "Create operating margin and guide capacity and reliability decisions before SLA breaches."
        },
        {
          "term": "RPO/RTO",
          "definition": "Maximum acceptable data loss and maximum time to recover service after an incident.",
          "whyItMatters": "Connect checkpoints, retention, replay and runbooks with verifiable continuity commitments."
        }
      ],
      "workedScenario": {
        "situation": "Operations calls for data in less than two minutes, 99.9% complete, and recovery in thirty minutes for a flow that sees tenfold spikes every Friday.",
        "reasoning": [
          "Define p95/p99 freshness, window reconciliation and RTO with measurable flags from Kafka to the consumed table.",
          "Test peak capacity, including state store and sink, and reserve enough headroom so that the backlog does not consume the error budget.",
          "Rehearse drop and replay within the retention, documenting degraded mode and responsible when an external dependency prevents compliance."
        ],
        "outcome": "The agreement is no longer aspirational: each promise has measurement, capacity, budget and associated evidence of recovery."
      }
    },
    "keyPoints": [
      "Freshness compares posted business time with the clock; Availability only indicates whether the process is running.",
      "Completeness requires a denominator or authoritative reconciliation.",
      "The error budget determines when a deviation is incident and what changes are prioritized."
    ],
    "decisions": [
      "Freshness compares posted business time with the clock; Availability only indicates whether the process is running.",
      "Completeness requires a denominator or authoritative reconciliation.",
      "The error budget determines when a deviation is incident and what changes are prioritized."
    ],
    "example": {
      "title": "Indicators of freshness and completeness",
      "note": "Completeness needs to compare `published_events` with a source-independent count or producer manifest."
    },
    "pitfalls": [
      "Measure only microbatch duration and call it business freshness.",
      "Set an SLA without defining time zone, percentile, window, or invalid event exclusions."
    ],
    "examDecision": "If the requirement is operational, look for an observable metric and a threshold; selecting `continuous` or more workers without SLO does not demonstrate compliance.",
    "checkpoint": {
      "question": "Why might an `ACTIVE` query violate freshness?",
      "answer": "It can remain active while accumulating backlog or publishing old events; You have to measure the difference between event time and publication time."
    }
  },
  "m17-l2": {
    "summary": "The architecture separates auditable input, stateful transformation, idempotent publishing, and observability so that each frontier can be recovered.",
    "explanation": [
      "Bronze preserves the original event and origin coordinates. Silver validates schema, deduplicates and applies temporary rules. Gold serves aggregates with the agreed latency. Each query has an exclusive checkpoint and each table a key or contract that allows it to be recomposed from a previous layer.",
      "Capacity is designed for the sustained rate plus a recovery margin. If ten million events arrive after an hour of downtime, the pipeline must process faster than the normal rate to return to the SLA. Separating ingestion from aggregation prevents a heavy stateful operator from blocking input capture."
    ],
    "deepDive": {
      "mentalModel": "A recoverable streaming architecture separates boundaries of responsibility. The bronze entry preserves the original envelope and a reproducible identity; stateful transformations use their own checkpoints; canonical output is confirmed idempotently; Observability records both technical progress and business truth. Coupling all stages into a single query appears to reduce latency, but expands the failure domain and causes a slow API to block ingestion. Separating them with Delta tables adds a commit and some latency, in exchange for replay, isolation and independent evolution. Each consumer has its checkpoint, so repairing one does not rewind the others. The medallion model is not just quality organization: its commits are recovery frontiers. Schemas, keys, sequences, and expectations form versioned contracts, and external effects are derived after an auditable canonical source exists.",
      "mechanics": [
        "The first stream captures Kafka or bronze files with metadata, basic parsing, and an ingestion checkpoint. Another stream reads the table as incremental source, applies deduplication, windowing or AUTO CDC and publishes silver with its own state. Gold materializes consumer products with corresponding latency. If silver fails, bronze continues accumulating data and the reboot resumes from its checkpoint; If there is a logical bug, a new version can reproduce the bronze range to a parallel destination without touching input offsets.",
        "Each border adds storage, governance, and potential delays. For extremely simple flows, a single query may be sufficient, but you must preserve raw data and isolate non-transactional sinks. The checkpoint is not shared between stages or environments. Table and path names include contract version; an incompatible change creates parallel fate and cutover. Bronze retention covers maximum detection time plus reconstruction. Security limits who can modify sources, checkpoints and targets, because deleting state is an integrity action, not routine maintenance."
      ],
      "concepts": [
        {
          "term": "Recovery frontier",
          "definition": "Durable commit from which a downstream stage can resume or rebuild without rereading the original system.",
          "whyItMatters": "Reduces impact radius and makes it possible to repair a transformation without affecting ingestion."
        },
        {
          "term": "Canonical table",
          "definition": "Governed representation that constitutes the published truth for a stage or domain.",
          "whyItMatters": "Decouples external effects and consumers from transport retries and formats."
        },
        {
          "term": "Impact radius",
          "definition": "Set of stages, data, and consumers affected when a component fails or changes.",
          "whyItMatters": "Guides the decision to separate queries and checkpoints even if it slightly increases latency."
        }
      ],
      "workedScenario": {
        "situation": "A scoring API starts responding slowly and blocks the `foreachBatch` which also ingests critical events from Kafka.",
        "reasoning": [
          "Separate the bronze capture and the silver decision from the HTTP effect, setting Delta commits before any external dependencies.",
          "Create a publishing consumer with its own checkpoint, idempotency key and retry/circuit breaker policy.",
          "Scale retention and alerts so that the external backlog is repaired without stopping ingestion or reprocessing already confirmed decisions."
        ],
        "outcome": "Downgrading the provider only delays its consumer; the historical and canonical product remain available and repairable."
      }
    },
    "keyPoints": [
      "Immutable Bronze provides replay and auditing.",
      "Independent checkpoints reduce the radius of impact of a change or failure.",
      "Resiliency must exceed the arrival rate, not just sustain it."
    ],
    "decisions": [
      "Immutable Bronze provides replay and auditing.",
      "Independent checkpoints reduce the radius of impact of a change or failure.",
      "Resiliency must exceed the arrival rate, not just sustain it."
    ],
    "example": {
      "title": "Pipeline operating contract",
      "note": "This contract must be accompanied by queries that calculate each indicator and links to the runbook."
    },
    "pitfalls": [
      "Couple ingestion, external enrichments, and aggregation into a single query with no intermediate replay point.",
      "Sizing only for the average and not being able to reduce backlog after an interruption."
    ],
    "examDecision": "To limit failure radius and allow replay, persist bronze and separate checkpoints by stage; don't chain all effects into a single opaque `foreachBatch`.",
    "checkpoint": {
      "question": "What condition allows a pipeline to retrieve backlog?",
      "answer": "Your effective throughput during recovery must exceed the arrival rate as long as the source retains the necessary data."
    }
  },
  "m17-l3": {
    "summary": "A recovery plan distinguishes reboot, replay and rebuild, and never erases state before capturing evidence and delimiting the affected range.",
    "explanation": [
      "A temporary failure of the executor is usually resolved by resuming from the same checkpoint. An incompatible state change requires a new checkpoint and rebuild from bronze. A published logic error requires identifying affected versions or timings, fixing code, and writing idempotently to an isolated target before cutover.",
      "Retention of Kafka, CDF, files and Delta must cover the RTO and maximum detection time. If the source has already deleted data, restoring compute does not restore completeness. Runbooks include criteria for pausing producers or consumers, alternative routes, and subsequent validation."
    ],
    "deepDive": {
      "mentalModel": "Recovering doesn't always mean rebooting. A reboot restores the same plan from a compatible checkpoint after a transient failure. A replay reprocesses an interval while preserving a durable source, usually toward staging or a new version. A rebuild rebuilds full state and target when semantics have changed or compatibility has been lost. Choosing poorly can hide loss or duplicate effects. Before acting, evidence is immobilized: error, batch, offsets, Delta versions, sink status and metrics. Deleting checkpoint turns recovery into a new query and eliminates the border that allowed reasoning. The runbook must indicate entry conditions, authority, RPO/RTO, validations and rollback. A replay is not released directly to production without reconciling keys, sequences, counts, and invariants; You must also avoid external effects until you approve the result.",
      "mechanics": [
        "For a transient compute or network failure, the scheduler retries the task and Spark restores offset, commit, and state store from the last committed batch. If there is a transformation bug, the first affected version is determined in bronze and new code and checkpoint are created to process the range to a parallel table. A rebuild uses snapshot or retained complete history to re-form stateful state. In all cases, a cut-off point is recorded to prevent production and correction from competing for the same keys without order.",
        "An in-place repair with `MERGE` can be valid when the function is deterministic and the key identifies all affected rows, but must handle deletes and derived changes. Side effects are disabled or use a separate outbox. Validation compares not just counts: uniqueness, financial totals, SCD intervals, watermarks, samples and versions. Cutover can be performed by changing a view or alias, preserving the previous output during rollback. Then it is decided whether to resume from the old checkpoint, chain from a new point or remove the faulty version."
      ],
      "concepts": [
        {
          "term": "Reboot",
          "definition": "Continuation of the same logical plan from the last supported checkpoint after an operational failure.",
          "whyItMatters": "It is the least impactful option when code, state, and data are still valid."
        },
        {
          "term": "Replay",
          "definition": "Deliberate reprocessing of a historical interval from a durable source with explicit boundaries.",
          "whyItMatters": "Corrects results without destroying the progress of the active query and offers comparison before publishing."
        },
        {
          "term": "Rebuild",
          "definition": "Complete or substantial reconstruction of the state and exit with a new checkpoint.",
          "whyItMatters": "It is necessary in the event of incompatible changes or corruption, but requires cutting, cost and reconciliation planning."
        }
      ],
      "workedScenario": {
        "situation": "One code version multiplied amounts for three hours; The query has already progressed and the subsequent microbatches are correct.",
        "reasoning": [
          "Capture affected versions and offsets, stop sensitive downstream effects and preserve the checkpoint to avoid losing evidence.",
          "Reprocess only the range from bronze with corrected code to staging and compare keys, sums and deletes against sources.",
          "Apply an idempotent key repair or cutover of the validated table, reactivating consumers from a documented border."
        ],
        "outcome": "The historical correction does not rewind healthy data or duplicate effects and is accompanied by sufficient evidence for audit and rollback."
      }
    },
    "keyPoints": [
      "Reboot preserves checkpoint; replay uses an isolated range and state; rebuild rebuilds an entire table.",
      "Captures `lastProgress`, offsets, code version and error before mutating state.",
      "Origin retention is a recovery requirement, not just a cost decision."
    ],
    "decisions": [
      "Reboot preserves checkpoint; replay uses an isolated range and state; rebuild rebuilds an entire table.",
      "Captures `lastProgress`, offsets, code version and error before mutating state.",
      "Origin retention is a recovery requirement, not just a cost decision."
    ],
    "example": {
      "title": "Delimitation of a repair window",
      "note": "Repair to a shadow table first and compare keys/counts before replacing or MERGEing in production."
    },
    "pitfalls": [
      "Delete checkpoint as a first step and lose the exact point of the incident.",
      "Reprocess the entire history in the same destination without isolating writes or avoiding duplicates."
    ],
    "examDecision": "Transient failure: resume. Incompatible stateful change: new checkpoint and rebuild. Data error: delimited and idempotent replay with prior validation.",
    "checkpoint": {
      "question": "When is it appropriate to retain the checkpoint during recovery?",
      "answer": "When the topology and state are still compatible and the failure is transient; thus it resumes from the confirmed offsets."
    }
  },
  "m17-l4": {
    "summary": "Observability combines Spark progress, source lag, data quality, and business SLO to deliver actionable alerts.",
    "explanation": [
      "Query progress shows duration, rates and status; Kafka or Auto Loader provide backlog; Silver tables provide maximum event time and discards. A freshness alert must link these signals to differentiate stopped source, process neck, invalid data or slow sink.",
      "Metrics are written to a table with `query_id`, `batch_id`, version and timestamp. A dashboard without alerts or owner does not reduce recovery time. Each alarm must include threshold, period, severity, link to evidence and first safe action."
    ],
    "deepDive": {
      "mentalModel": "Useful observability links four planes: query health, source progress, state behavior, and product quality. A dashboard that only shows cluster and `RUNNING` status may remain green while old or incomplete data is published. The technical metrics—offsets, batch duration, input rate, state rows, retries—respond to how the engine works. The business metrics—maximum event time, orders per market, sum of amounts, valid percentage—respond to whether the promised product is delivered. Each alert must combine duration and severity to avoid noise during empty microbatches or normal bursts, and must signal a first check. Structured logs include run, query, batch, checkpoint version and source correlation; Trading tables allow trends and postmortems beyond the retention of the interface.",
      "mechanics": [
        "A collector persists `StreamingQueryProgress` per batch and calculates Kafka lag per partition. Consultations on the published tables derive freshness and volume per window. Expectations or reconciliation rules produce discard rates. Indicators are tagged by pipeline, environment, and code version to compare deployments. A backlog alert requires that the lag increases over several windows and that the processing rate does not catch up with arrival; A still data alert considers activity calendars to not trigger during legitimate non-event periods.",
        "Excessive label cardinality can turn order_id or offset into millions of series; Those details are saved in logs/tables and the metrics use bounded dimensions. Notifications are directed by ownership and severity. The runbook correlates patterns: increasing lag with idle CPU points to sink or hot partition; growing state with stopped watermark points to slow font or timestamps; Bad freshness without backlog points to delayed upstream event time. After each incident a signal is added that would have shortened detection or diagnosis, not an ornamental dashboard."
      ],
      "concepts": [
        {
          "term": "Technical observability",
          "definition": "Telemetry on execution, offsets, resources, status and failures of the streaming engine.",
          "whyItMatters": "It locates operational mechanisms, but needs business context to determine real impact."
        },
        {
          "term": "Business observability",
          "definition": "Indicators on freshness, volume, quality and consistency of the delivered data product.",
          "whyItMatters": "Detects technically active pipelines that produce useless or incomplete results."
        },
        {
          "term": "Actionable alert",
          "definition": "Rule with sustained threshold, severity, owner and first hypothesis or associated safe action.",
          "whyItMatters": "Reduces fatigue and transforms a signal into shorter diagnosis and recovery time."
        }
      ],
      "workedScenario": {
        "situation": "The stream maintains normal rates and zero errors, but an update from the producer leaves `event_ts` frozen while it continues to send new rows.",
        "reasoning": [
          "Detect the anomaly with freshness based on maximum event time and with the increasing skew between ingestion and event time, not with Job status.",
          "Map by version and producer to isolate the change, quarantining invalid timestamps before they affect watermarks.",
          "Activate the upstream owner runbook and measure recovery of freshness and quarantine backlog after the correction."
        ],
        "outcome": "The platform identifies a semantic flaw that compute metrics couldn't see and prevents frozen timestamps from muting the SLA."
      }
    },
    "keyPoints": [
      "A single technical metric rarely explains a business failure.",
      "Alerts use sustained windows to avoid noise from an isolated microbatch.",
      "Code version and query ID allow you to correlate regressions with deployments."
    ],
    "decisions": [
      "A single technical metric rarely explains a business failure.",
      "Alerts use sustained windows to avoid noise from an isolated microbatch.",
      "Code version and query ID allow you to correlate regressions with deployments."
    ],
    "example": {
      "title": "Structured progress recording",
      "note": "For a production solution use a managed listener or monitor and monitor volume/PII of the progress JSON."
    },
    "pitfalls": [
      "Alert for a low rate when the source has no events and the SLO is still satisfied.",
      "Save logs without `batch_id`, version or owner, preventing correlation and response."
    ],
    "examDecision": "If an alert must be actionable, it includes the business signal, backlog/progress, and deployment context; don't alert just because a query is down.",
    "checkpoint": {
      "question": "What signs distinguish a stopped source from a slow consumer?",
      "answer": "Source stopped: offsets and event times do not increase. Slow consumer: offsets/backlog increase while the processed rate remains below the arrival rate."
    }
  },
  "m17-l5": {
    "summary": "A game day verifies with controlled failures that checkpoints, capacity, alerts and runbook meet the RTO without duplicating or losing data.",
    "explanation": [
      "The test can stop computing for ten minutes, introduce a late event, and restart from the same checkpoint. Time to recover freshness, maximum lag, duplicates and completeness are measured. Another test deploys an incompatible stateful change in an isolated environment to practice rollback or rebuild.",
      "The runbook is written as observable decisions: if the checkpoint is complete and the code is compatible, resume; if offsets are missing, scale loss and reconcile; If the sink has external effects, check idempotency. The result of the exercise generates actions with the person responsible and the date."
    ],
    "deepDive": {
      "mentalModel": "A game day turns assumptions of resilience into evidence through controlled failures. It does not seek to prove that nothing fails; checks that detection, recovery, idempotence and communication work within RTO/RPO. The experiment defines hypotheses, scope, safety guards, synthetic or reversible data, responsible parties and abortion criteria. Representative failures are chosen: killing the driver during a commit, slowing down a sink, stopping a partition, sending poison pills or filling backlog. The expected state is recorded first and then each event is reconciled. A successful reboot is not enough: you must demonstrate that there are no missing or extra keys, that the state store recovered, that alerts reached the owner, and that the runbook did not require tribal knowledge. The results feed capacity, automation and documentation; A failure in the exercise is learning before a real incident.",
      "mechanics": [
        "The team prepares a set of events with known identifiers and totals, activates telemetry, and marks launch versions. Injects the fault in an agreed window and measures time to alert, recognition, diagnosis, mitigation and complete recovery. The restart uses the same policies as production, without deleting checkpoints. In the end, reconciliation queries compare font, bronze, silver and external effects; Zero lag or within threshold and stable state are also checked after several microbatches.",
        "The guards avoid experimenting on irreversible data or exceeding the error budget: volume limits, feature flags, circuit breakers and rehearsed rollback. A game day that is too small may not reveal a skew or a long checkpoint; one without objective only generates chaos. It is repeated with realistic peak and with degraded dependence. Subsequent actions have owner and date: improve alert, increase retention, correct idempotence or split architecture. The next run validates that the improvement changed the metric, closing the reliability loop."
      ],
      "concepts": [
        {
          "term": "Resilience hypothesis",
          "definition": "A measurable statement about how the system will respond to a specific failure under defined conditions.",
          "whyItMatters": "It allows you to declare success or failure with evidence instead of accepting that Job turned green."
        },
        {
          "term": "Guardrail",
          "definition": "Technical or operational limit that contains the impact of the experiment and activates abort or rollback.",
          "whyItMatters": "It makes it possible to test realistic scenarios without turning learning into an uncontrolled incident."
        },
        {
          "term": "Post-failure reconciliation",
          "definition": "Comparison of identities, counts, amounts and effects before and after recovering.",
          "whyItMatters": "It demonstrates RPO and idempotency, properties that a RUNNING state capture cannot test."
        }
      ],
      "workedScenario": {
        "situation": "Before Black Friday, Payments wants to validate that a driver crash during `foreachBatch` does not double charges and is recovered within twenty minutes.",
        "reasoning": [
          "Create synthetic payments with known totals, idempotency keys and guards that prevent reaching the real provider outside the controlled environment.",
          "Interrupt the driver at the write border, measure alert and follow the runbook without modifying or deleting checkpoint.",
          "Reconcile Kafka, Delta and the external simulator, verifying an application by `payment_id`, recovered backlog and times within the RTO."
        ],
        "outcome": "The test provides quantitative evidence of recovery and uncovers any alert gaps or idempotence before the trading peak."
      }
    },
    "keyPoints": [
      "Defines initial state and success criteria before injecting the fault.",
      "It measures RTO and final quality, not just that the process returns to RUNNING status.",
      "The game day must be reversible, isolated and approved by the owner of the service."
    ],
    "decisions": [
      "Defines initial state and success criteria before injecting the fault.",
      "It measures RTO and final quality, not just that the process returns to RUNNING status.",
      "The game day must be reversible, isolated and approved by the owner of the service."
    ],
    "example": {
      "title": "Playable game day case",
      "note": "Don't run a resilience experiment in production without explicit boundaries, observability, and authorization."
    },
    "pitfalls": [
      "Declare success when the query restarts even though the backlog and duplicates continue to grow.",
      "Test production checkpoint deletion without snapshot, isolation or rollback procedure."
    ],
    "examDecision": "A recovery is considered complete when it restores SLO and quality within the RTO; `RUNNING` alone is not a sufficient criterion.",
    "checkpoint": {
      "question": "What four minimum results should a streaming game day record?",
      "answer": "RTO, recovered freshness, final completeness and absence/control of duplicates, along with backlog evidence."
    }
  },
  "m18-l1": {
    "summary": "Spark Declarative Pipelines define datasets and dependencies; Lakeflow extends the framework and manages graph, updates, lineage, and events.",
    "explanation": [
      "Instead of manually starting multiple `writeStream`s, each function returns a DataFrame that defines a dataset. Readings between datasets establish dependencies and the pipeline determines the order. This reduces operational code, but does not eliminate decisions about contract, increaseability, quality or cost.",
      "The graph must express data transformations, not imperative steps with external effects. Creating files, calling APIs or arbitrarily mutating tables within a declarative function breaks reevaluation and makes optimization difficult. Those effects belong to Jobs' tasks around the pipeline."
    ],
    "deepDive": {
      "mentalModel": "Spark Declarative Pipelines changes the unit of reasoning from a sequence of commands to a graph of datasets and flows. The author declares what each streaming table, materialized view or sink represents and their dependencies are deduced from the reads; the engine builds the DAG, chooses the valid order, and manages incremental updates. At Databricks, Lakeflow pipelines is the managed offering that extends and interoperates with the Apache Spark Declarative Pipelines framework over an optimized runtime, adding operation, event log, governance and specific capabilities. The framework should not be confused with the old trade name Delta Live Tables: previous code or tests may use DLT, but the current model is expressed as pipelines, flows and datasets. Declarative does not mean automatic without a contract: keys, temporal semantics, quality, costs and compatibility still belong to human design.",
      "mechanics": [
        "When loading the project, the runtime evaluates the definitions to build metadata and dependencies; that's why declarative functions should return DataFrames and avoid initiating arbitrary actions. A read from another dataset creates an edge of the graph. During an update, the service determines which flows should be executed, provisions compute according to configuration, applies transformations, and commits each target using transactions. The event log records planning, progress, quality and lineage. The order of the source file does not define the order of execution; data dependencies do.",
        "Incremental automation can reduce orchestration code, but it does not guarantee that every query is incrementalized or that a materialized view always avoids recomputation. Definition changes can alter the fingerprint of the plan and cause a broader refresh. An external effect within a declarative function can be executed during validation or retries and breaks reproducibility. For portability, the API available in Apache Spark Declarative Pipelines is distinguished from managed extensions to Lakeflow pipelines, such as certain operational capabilities and AUTO CDC, documenting any Databricks-specific dependencies."
      ],
      "concepts": [
        {
          "term": "pipeline",
          "definition": "Managed development and execution unit that contains datasets, flows, sinks, configuration and the dependency graph that relates them.",
          "whyItMatters": "Defines the update, observability and deployment boundary that the team operates as a coherent product."
        },
        {
          "term": "flow",
          "definition": "Declarative relationship that processes a source through a query and writes its results to a destination managed by the pipeline.",
          "whyItMatters": "It separates the data movement logic from the persistent object and allows multiple controlled inputs to a target."
        },
        {
          "term": "Declarative evaluation",
          "definition": "Phase in which the runtime interprets definitions to discover objects and dependencies before performing actual data processing.",
          "whyItMatters": "Explains why functions must be deterministic and contain no actions, external calls, or file order-dependent effects."
        }
      ],
      "workedScenario": {
        "situation": "A team migrates fifteen notebooks that call each other and create tables using side effects; Partial failures leave incoherent datasets and no one can explain the full lineage to audit.",
        "reasoning": [
          "Model each stable output as a streaming table or materialized view and express dependencies exclusively through reads from datasets declared in the graph.",
          "Extract notifications and external calls outside of definitions, leaving deterministic functions that only construct and return reproducible DataFrames.",
          "Operate the set as a versioned pipeline and consult its event log to validate order, lineage, quality and result of each update."
        ],
        "outcome": "The migration replaces fragile manual control with an inferred and observable DAG, while preserving explicit decisions about contracts, incremental updating, and platform-specific dependencies."
      }
    },
    "keyPoints": [
      "Declarative functions return DataFrames and should not execute actions such as `collect()` or manual writes.",
      "Dependencies come from reads, not from the physical order of functions in the file.",
      "The event log provides graph progress, quality, lineage, and errors."
    ],
    "decisions": [
      "Declarative functions return DataFrames and should not execute actions such as `collect()` or manual writes.",
      "Dependencies come from reads, not from the physical order of functions in the file.",
      "The event log provides graph progress, quality, lineage, and errors."
    ],
    "example": {
      "title": "Two connected declarative datasets",
      "note": "The logical name `orders_bronze` creates the dependency; the pipeline manages update and metadata."
    },
    "pitfalls": [
      "Call `display`, `count` or `saveAsTable` inside a decorated function and mix declaration with execution.",
      "Rely on file order instead of explicitly reading the upstream dataset."
    ],
    "examDecision": "If the objective is to declare a graph of tables and views with managed operation, use pipelines; for external effects or control flow, wrap it with Lakeflow Jobs.",
    "checkpoint": {
      "question": "What creates an edge between two datasets in the pipeline?",
      "answer": "Let the downstream definition read the upstream dataset; The position of the functions in the file does not determine the dependency."
    }
  },
  "m18-l2": {
    "summary": "A streaming table processes new rows from a streaming source and preserves incremental semantics appropriate for bronze and silver append/CDC.",
    "explanation": [
      "A definition with `spark.readStream` produces a continuous or triggered stream within the pipeline. The table persists results and the service manages internal checkpoints. It is suitable when each new record can be processed incrementally without recalculating the entire result.",
      "You should not read a changing source with `spark.read` and expect streaming semantics. You also don't use a streaming table for a query that needs to review arbitrary changes on both sides of a join batch; a materialized view can allow managed incremental updating."
    ],
    "deepDive": {
      "mentalModel": "A streaming table represents a dataset whose state grows or changes through one or more incremental flows fed by streaming sources. It's not just a Delta table that someone runs append to: the pipeline manages the query, the checkpoint, and the relationship between definition and update. It is appropriate for bronze ingestion, continuous silver transformations, and CDC when the semantics can be expressed incrementally. Reading it as a stream transmits new changes to consumers; reading it as a batch relationship observes its materialized state. The input must actually be streaming (`readStream`, `STREAM(...)` or an equivalent source); Declaring a streaming table does not by itself convert a full batch query to an incremental one. It is also important to distinguish pure append from updates: AUTO CDC uses a managed flow to apply changes to a target streaming table, while a simple append would preserve multiple versions as independent rows.",
      "mechanics": [
        "In Python, a decorated function or table definition declares the target and returns a streaming DataFrame. In SQL, `CREATE OR REFRESH STREAMING TABLE ... AS SELECT ... FROM STREAM(source)` expresses incremental reading. The pipeline assigns progress to the source, executes new ranges, and commits transactions to the target. When a downstream uses read streaming, it consumes the changes that the target semantics expose. Properties, comments and expectations are associated with the dataset for governance and quality during each update.",
        "A streaming table excels when transformations support incremental processing and the business accepts its update semantics. Stateful joins or aggregations still require time limits and can accumulate state. Changing a query may require a full refresh or invalidate history, depending on the transformation and metadata. If the source delivers full snapshots, treating them as a stream append would duplicate all entities; you need materialized view, AUTO CDC FROM SNAPSHOT or a stage that interprets version and differences. The table does not eliminate the responsibility of retention and replay of the raw input."
      ],
      "concepts": [
        {
          "term": "Streaming table",
          "definition": "Persistent dataset managed by a pipeline whose flows incrementally process one or more streaming sources and preserve recoverable progress.",
          "whyItMatters": "It is the main object for ingestion and continuous transformations without manually managing each `writeStream` and checkpoint."
        },
        {
          "term": "Streaming reading",
          "definition": "A read that observes only new changes available from a source and maintains an incremental position between successive updates.",
          "whyItMatters": "It avoids scanning the entire state, but requires that upstream semantics can be correctly propagated as changes."
        },
        {
          "term": "Full refresh",
          "definition": "Rebuilding the contents of a dataset from its sources rather than continuing only existing incremental progress.",
          "whyItMatters": "It may be necessary after incompatible changes and requires considering cost, retention and effects on consumers."
        }
      ],
      "workedScenario": {
        "situation": "One source deposits append-only order events every minute, while another delivers a complete customer file every night; The team proposes using the same streaming definition for both.",
        "reasoning": [
          "Use a streaming table with Auto Loader for orders, because each file contains new facts and there is a clear incremental boundary.",
          "Reject direct append of client snapshots and select AUTO CDC FROM SNAPSHOT or a materialized view depending on the required history.",
          "Document for each target what changes downstream exposes, how it is recovered and under what conditions a modification requires a complete refresh."
        ],
        "outcome": "Each source receives an object according to its semantics, avoiding duplicating snapshots as events and preserving real incremental processing where it exists."
      }
    },
    "keyPoints": [
      "`spark.readStream` points to incremental input.",
      "The pipeline manages operational status; `checkpointLocation` is not defined within the dataset.",
      "Support for streaming transformations still applies, including watermarks for bounded state."
    ],
    "decisions": [
      "`spark.readStream` points to incremental input.",
      "The pipeline manages operational status; `checkpointLocation` is not defined within the dataset.",
      "Support for streaming transformations still applies, including watermarks for bounded state."
    ],
    "example": {
      "title": "Streaming table from files with Auto Loader",
      "note": "The Auto Loader schema location is still required even if the pipeline manages its own state."
    },
    "pitfalls": [
      "Manually add `writeStream` or `checkpointLocation` inside a pipeline definition.",
      "Apply a stateful aggregation without watermark and transfer an unlimited state to the service."
    ],
    "examDecision": "Choose streaming table when the input and transformation are incremental row by row; preserves materialized view for results that the service can refresh from upstream changes.",
    "checkpoint": {
      "question": "Who manages the checkpoint of a streaming table in a pipeline?",
      "answer": "Spark Declarative Pipelines in Lakeflow; the dataset code should not start a `writeStream` or declare its checkpoint."
    }
  },
  "m18-l3": {
    "summary": "A materialized view stores the result of a declarative batch query, and the service attempts to update it incrementally when its dependencies change.",
    "explanation": [
      "Unlike a logical view, the output is materialized to serve quick queries. The definition usually uses `spark.read.table` because it describes the correct complete result. The engine decides if it can apply incremental changes or if it needs to recompute based on query and source.",
      "It is appropriate for joins, aggregations and gold models where the result can change due to upstream updates. It does not promise that every query will always be incremental; Design of keys, filters and operations influences the refresh plan and must be observed in the event log."
    ],
    "deepDive": {
      "mentalModel": "A materialized view stores the result of a declarative query and updates it when its dependencies change. Unlike a logical view, it does not recalculate for each reader; Unlike a streaming table, its query is formulated on batch relationships and describes the complete desired state. The engine attempts to maintain it incrementally when the plan and sources allow it, but the contract does not promise that all transformations will avoid recomputation. This makes it suitable for aggregates, joins and gold products whose semantics are a consistent snapshot. The author must reason about refresh freshness, update cost and incrementalization capacity. An independent materialized view created from SQL still uses a pipeline managed behind it, while a Lakeflow project groups many objects under a single operational boundary. Changing the definition can alter the plan and trigger a broader refresh.",
      "mechanics": [
        "The definition records a query and its dependencies. At each refresh, the system detects upstream changes and determines a strategy: apply only deltas when it can demonstrate equivalence or recompute parts or all of the result when it cannot. The result is published transactionally as a queryable table. The event log and the query fingerprint allow us to observe the update mode and the causes of a complete refresh. Consumers read the materialized state without running the original join or aggregate on each query.",
        "Incrementalization depends on operators, sources, and code changes; Minimum cost should not be budgeted without measuring. An opaque UDF, nondeterministic query, or incompatible dependency may force recomputation. A high refresh rate improves freshness, but can overlap small changes with startup overhead; a lower one reduces cost and serves older data. If the requirement is to react row by row to a streaming source with an explicit checkpoint, a streaming table usually fits better. If a correctable snapshot is needed to reflect upstream deletes and updates, the materialized view often better expresses the intent."
      ],
      "concepts": [
        {
          "term": "Materialized view",
          "definition": "Persistent result of a declarative batch query that is refreshed by the pipeline to keep it in sync with its data dependencies.",
          "whyItMatters": "Delivers fast, consistent readings for complex products without recalculating the entire query per consumer."
        },
        {
          "term": "Incrementalization",
          "definition": "Ability of the engine to transform upstream changes into equivalent changes of the result without completely recomputing the declared query.",
          "whyItMatters": "It determines the cost and duration of the refresh, but it depends on the plan and should not be assumed as a universal guarantee."
        },
        {
          "term": "Query fingerprint",
          "definition": "Identity derived from the definition and plan that helps detect when the logic maintained by a materialized view changed.",
          "whyItMatters": "It allows you to explain complete refreshes and relate cost variations to specific code deployments."
        }
      ],
      "workedScenario": {
        "situation": "Finance needs a daily margin table that combines orders, returns and correctable exchange rates, with quick queries and a maximum freshness of one hour.",
        "reasoning": [
          "Choose materialized view because the product represents the complete corrected state of various relationships, including upstream updates and deletes.",
          "Configure and measure refresh schedule, observing in the event log if the plan increments or performs costly recomputations after changes.",
          "Keep the expressions deterministic and test a schema modification, estimating duration and budget before deploying it in production."
        ],
        "outcome": "Finance gets a consistent, quick-to-view snapshot, with an observable refresh strategy and a cost that is verified rather than assumed."
      }
    },
    "keyPoints": [
      "The definition expresses the complete result, although the refresh may be incremental.",
      "A materialized view stores data; a standard view recalculates when querying.",
      "The event log allows you to verify the mode and cost of the refresh instead of assuming it."
    ],
    "decisions": [
      "The definition expresses the complete result, although the refresh may be incremental.",
      "A materialized view stores data; a standard view recalculates when querying.",
      "The event log allows you to verify the mode and cost of the refresh instead of assuming it."
    ],
    "example": {
      "title": "gold materialized view",
      "note": "Check the event log to confirm whether specific updates use incremental refresh."
    },
    "pitfalls": [
      "Use `readStream` to reflect a materialized view that describes a changing full result.",
      "Promise incremental refresh for any UDF or query without looking at the actual plan."
    ],
    "examDecision": "For a materialized gold aggregate that should reflect upstream updates, prefer materialized view; for continuous append per row, streaming table.",
    "checkpoint": {
      "question": "Why can a materialized view definition use a batch read and still update incrementally?",
      "answer": "Because it declares the complete result and the service analyzes upstream changes to choose a refresh strategy when supported."
    }
  },
  "m18-l4": {
    "summary": "Flows allow multiple inputs to a target and distinguish append, AUTO CDC and `ONCE` loads within the same declarative model.",
    "explanation": [
      "A default flow accompanies the normal definition of a dataset. Additional flows can join regional feeds into a single streaming table without building a monolithic `union`. An append flow adds rows; AUTO CDC applies ordered changes; `ONCE` executes a batch load only once except full refresh.",
      "Each flow must have identity and semantics compatible with the target. An AUTO CDC target only receives AUTO CDC flows. For historical backfill, an isolated `ONCE` append flow can coexist with continuous ingestion, as long as it does not duplicate already processed ranges."
    ],
    "deepDive": {
      "mentalModel": "A flow is the unit that describes how data from a source reaches a target. Separating flow and table allows multiple sources to feed the same dataset under clear rules: an append flow for regions, an AUTO CDC flow for client changes or an `ONCE` flow for a historical load. Multiplicity is not equivalent to allowing arbitrary concurrent writes; All flows are part of the graph and the managed protocol of the pipeline. `ONCE` executes a load only once within the recorded lifecycle and can be executed again on a full refresh, so its logic must be deterministic. AUTO CDC is the current recommended name; `APPLY CHANGES` retains the same syntax and is still available, as well as appearing in Professional certification material. The student must recognize both terms without presenting the old name as the new option.",
      "mechanics": [
        "An append flow reads a compatible streaming or batch source and adds its rows to the declared target. Multiple append flows can unify feeds with the same contract, and each maintains its progress. An AUTO CDC flow adds semantics of keys, sequence, deletes and SCD on the destination streaming table. A flow marked `once` processes its input on the first applicable update and records that state; a complete reconstruction can include it again. The flow name helps distinguish progress, metrics, and errors in the event log.",
        "Multiple flows require compatible schemas and a global identity policy; two regions can produce the same key and create conflicts if not namespaced. An `ONCE` backfill should not write external effects or assume that it will never repeat under full refresh. Mixing event appends with full snapshots on the same target creates semantic duplicates. For CDC, changing from `apply_changes` to `create_auto_cdc_flow` may be a nominal migration because the signatures are equivalent, but changing sequence, keys or SCD type alters the contract and requires validation and possible new destination."
      ],
      "concepts": [
        {
          "term": "Append flow",
          "definition": "Declarative flow that incorporates records from a source to the target without interpreting each new row as an existing key update.",
          "whyItMatters": "Allows append-only sources to be joined, keeping progress and observability separate within the same pipeline."
        },
        {
          "term": "Flow ONCE",
          "definition": "Flow intended for a finite load that runs once on normal refreshes and may repeat during full refresh.",
          "whyItMatters": "It is used for bootstrap or backfill, but requires writing deterministic and reconstruction-compatible logic."
        },
        {
          "term": "APPLY CHANGES",
          "definition": "Previous name still available for the API whose current recommended option is called AUTO CDC and retains the same syntax.",
          "whyItMatters": "It can appear in legacy code and in the Professional blueprint, so it must be recognized without confusing the current recommendation."
        }
      ],
      "workedScenario": {
        "situation": "Three regions publish append-only orders, and a historical migration must load five years before activating daily flow without duplicating rows during future full refreshes.",
        "reasoning": [
          "Create regional append flows with a common schema and an identity that includes region when local identifiers may collide.",
          "Implement the history as a deterministic `ONCE` flow, deduplicated against the same global key and without irreversible external calls.",
          "Test a normal update and a full refresh, verifying that the target converges to the same set and that each flow appears separately in telemetry."
        ],
        "outcome": "The target integrates history and continuous arrivals through governed flows, preserving reproducible reconstruction and traceability by origin without ad hoc writing."
      }
    },
    "keyPoints": [
      "Several append flows can write to the same streaming table.",
      "AUTO CDC targets only accept AUTO CDC flows.",
      "`ONCE` serves for a finite load and is executed again on a full refresh."
    ],
    "decisions": [
      "Several append flows can write to the same streaming table.",
      "AUTO CDC targets only accept AUTO CDC flows.",
      "`ONCE` serves for a finite load and is executed again on a full refresh."
    ],
    "example": {
      "title": "Regional flows to a table",
      "note": "Validates common keys and schema; `BY NAME` avoids relying on the physical order of columns."
    },
    "pitfalls": [
      "Mix append and AUTO CDC on the same target without respecting flow restrictions.",
      "Use `ONCE` for data that will continue to arrive and silently stop ingesting after the first update."
    ],
    "examDecision": "When multiple compatible sources feed the same target, use separate flows; For state changes use AUTO CDC, not an updates append.",
    "checkpoint": {
      "question": "When would a flow marked `ONCE` be executed again?",
      "answer": "In the first update and again if a full refresh of the target or pipeline is performed, according to the documented semantics."
    }
  },
  "m18-l5": {
    "summary": "A maintainable pipeline separates datasets by domain and layer, parameterizes catalogs/paths, and maintains operational effects outside of definitions.",
    "explanation": [
      "Python files can be grouped by bronze, silver, and gold or by domain, as long as the dataset names are unique. Configuration such as source catalog, paths and thresholds is entered through pipeline parameters, not replicated constants. Pure transformation functions are tested outside of decorators.",
      "Dev, test and prod execute the same code with different targets and permissions. An update is validated against an isolated catalog and with representative data before promoting. The owner reviews event log, lineage and schema changes after deploying."
    ],
    "deepDive": {
      "mentalModel": "A maintainable declarative project organizes contracts, domains, and layers before giant files. Each dataset has a stable name, owner, comment, keys, expectations and clear dependency; the defining functions are small and pure. The environment configuration—catalog, schema, locations, size, or execution mode—is injected from the pipeline or bundle and is not coded in each notebook. Shared code can normalize columns and rules, but should not dynamically generate a graph that is impossible to review. Bronze preserves fidelity of origin, silver applies contracts and gold serves products; splitting by layers is only useful if each boundary has recovery semantics. Unit tests cover DataFrame functions, while integration tests create temporary datasets and run updates. Lakeflow pipelines provide the managed operation; the project still needs version control, review, and reproducible promotion.",
      "mechanics": [
        "During evaluation, the runtime imports modules and registers definitions; Any access to widgets, clock, network, or Spark actions can change the graph between runs. Code paths are explicitly included in the configuration and shared imports remain deterministic. Parameters like `catalog` and `environment` are read from configuration and validated at startup. A bundle or CI process deploys the same source with different variables, creates the pipeline, and runs a test update before promotion. The event log is published to a governed operational schema.",
        "Separating a pipeline for each table maximizes isolation but multiplies operation and latency; Grouping all domains reduces overhead but expands the radius of failure and permissions. The appropriate boundary brings together datasets that change and recover together. Excessive metaprogramming hides names and lineage; Small repetition may be preferable to an opaque factory. The libraries are fixed and tested with the runtime version. An incompatible change creates parallel version, compares data and does cutover, instead of silently mutating a shared table."
      ],
      "concepts": [
        {
          "term": "pure definition",
          "definition": "Deterministic declarative function that constructs and returns a DataFrame without executing actions or producing external effects during evaluation.",
          "whyItMatters": "Ensures that the same code and configuration generate the same graph on validation, deployment, and retry."
        },
        {
          "term": "Pipeline boundary",
          "definition": "Set of datasets and flows that share updating, configuration, permissions, observability and coordinated recovery strategy.",
          "whyItMatters": "Balance operational isolation with complexity and avoid bundling domains that should not fail or deploy together."
        },
        {
          "term": "Reproducible promotion",
          "definition": "Process that deploys the same versioned artifact in dev, test and prod, changing only controlled configuration and credentials.",
          "whyItMatters": "It reduces manual divergences and allows each result to be attributed to a specific reviewed and tested version."
        }
      ],
      "workedScenario": {
        "situation": "A 3,000-line pipeline mixes sales and human resources, contains coded production routes, and creates tables based on time of day during evaluation.",
        "reasoning": [
          "Separate domains by permissions and recovery cycle, defining stable contracts and pure functions for each dataset in the graph.",
          "Extract catalog, schema and environment to validated configuration, fix dependencies and eliminate decisions based on clock or side effects.",
          "Deploy using the same artifact in test, run fixtures and compare event log and results before promoting the version to production."
        ],
        "outcome": "The project remains reviewable, repeatable and isolated by domain; a deployment produces the same expected graph and can be rolled back using an identifiable version."
      }
    },
    "keyPoints": [
      "Settings change by environment; logic and artifact remain the same.",
      "Pure transformations are testable without starting the entire pipeline.",
      "Table names, comments, and properties are part of the governed contract."
    ],
    "decisions": [
      "Settings change by environment; logic and artifact remain the same.",
      "Pure transformations are testable without starting the entire pipeline.",
      "Table names, comments, and properties are part of the governed contract."
    ],
    "example": {
      "title": "Environment setup without duplicating code",
      "note": "Applies permissions and ownership in the deployment configuration; An assertion does not replace environmental policies."
    },
    "pitfalls": [
      "Copy the entire pipeline to prod and allow the versions to diverge.",
      "Introduce external calls into declarative functions and create non-deterministic results during re-evaluation."
    ],
    "examDecision": "For safe promotion, use a single artifact parameterized by environment and test pure transformations; do not maintain permanent code branches per workspace.",
    "checkpoint": {
      "question": "What should vary between dev and prod?",
      "answer": "Catalogs, routes, sizes, identities and parameters; the same versioned logic must be promoted between environments."
    }
  },
  "m19-l1": {
    "summary": "Expectations convert quality rules into metrics and declarative actions: observe, discard, or fail to update.",
    "explanation": [
      "`expect` preserves both valid and invalid rows and records metrics; It is useful during adoption or for informational rules. `expect_or_drop` removes non-compliant rows and allows you to continue. `expect_or_fail` stops the flow and atomically rolls back the affected update when accepting bad data would be worse than delaying publication.",
      "Action is chosen for impact and remedial ability, not nominal severity. A null `order_id` can be quarantined if the rest of the pipeline must continue; a violation of uniqueness in a regulated balance may justify failure. Every rule needs an owner, definition and operational threshold."
    ],
    "deepDive": {
      "mentalModel": "An expectation is a Boolean rule applied to each row that combines observation with a response policy. The same expression can persist rows and log metrics, discard invalid ones, or fail the update. The choice does not express aesthetic severity, but rather the harm of publishing the data and the ability to remedy it. `warn`—retention behavior—serves to measure and explore; `drop` avoids contaminating the target when losing those rows is accepted and traceability exists; `fail` protects invariants whose violation invalidates the entire result. On a failed update, the flow transaction is rolled back, but the scope on parallel and dependent flows varies depending on the pipeline mode. Additionally, the `fail` metrics have limitations because the update is not committed like a normal execution. The rule needs stable name, owner, threshold and investigation path.",
      "mechanics": [
        "The expectation is incorporated into the plan of the streaming table or materialized view and evaluates one SQL expression per row. With hold, all rows continue and passed/failed counters are published. With drop, rows that produce false or invalid semantics are excluded and counted. With fail, a violation raises an error, aborts the affected update, and preserves the previously committed target. In triggered pipelines, other parallel flows can continue; In continuous, the flow, its dependents and the pipeline are stopped according to the documented behavior.",
        "A constraint does not replace table integrity testing, count reconciliation, or drift detection. Expensive expressions are executed per row and can impact throughput. A null in three-valued SQL logic does not automatically equal true, so conditions must treat it explicitly. Applying drop without persisting the row and its origin destroys correction capacity. Failure in the event of any optional anomaly creates unavailability; warn for a null primary key publishes corruption. The policy is decided with risk analysis and error budget."
      ],
      "concepts": [
        {
          "term": "Expectation",
          "definition": "Named constraint based on a Boolean expression that evaluates quality during processing and registers or applies a configured action.",
          "whyItMatters": "Integrate quality checks with metrics and pipeline transactions instead of relying on isolated post-checks."
        },
        {
          "term": "Hold, drop, fail",
          "definition": "Three policies that respectively preserve and measure, exclude invalid rows, or abort the update upon detecting a violation.",
          "whyItMatters": "They allow each rule to be aligned with impact, remediation and availability, avoiding using a single response for every anomaly."
        },
        {
          "term": "Three value logic",
          "definition": "SQL semantics where an expression with null can return unknown instead of explicit true or false.",
          "whyItMatters": "It forces nullability constraints to be formulated carefully so as not to classify data differently than the intention."
        }
      ],
      "workedScenario": {
        "situation": "An order feed features 0.02% unknown zip codes and occasionally negative amounts, while null `order_id` would make it impossible to reconcile any sales.",
        "reasoning": [
          "Retain and measure postal codes initially to know distribution without interrupting a flow whose main data remains usable.",
          "Send negative amounts to a repairable route or discard them according to the financial contract, preserving identity and evidence of the queue.",
          "Fail the update when `order_id` is null because it violates structural identity and verify the scope of the failure on dependent flows."
        ],
        "outcome": "Each anomaly receives a proportional and observable response: availability for tolerable cases, remediation for repairable data, and transactional protection for critical invariants."
      }
    },
    "keyPoints": [
      "`expect` measures without removing; `expect_or_drop` continues without the row; `expect_or_fail` aborts the affected flow.",
      "Expectation names must be stable and describe the contract.",
      "Failing an update protects the target, but can consume the freshness budget."
    ],
    "decisions": [
      "`expect` measures without removing; `expect_or_drop` continues without the row; `expect_or_fail` aborts the affected flow.",
      "Expectation names must be stable and describe the contract.",
      "Failing an update protects the target, but can consume the freshness budget."
    ],
    "example": {
      "title": "Three differentiated quality actions",
      "note": "Applying three actions to the same dataset is only correct if the business has explicitly decided the treatment of each violation."
    },
    "pitfalls": [
      "Use `expect_or_fail` for any failure and turn a fixable queue into a complete flow crash.",
      "Use `expect` for a mandatory key and allow invalid ones to reach consumers silently."
    ],
    "examDecision": "Unblocked observability: `expect`. Isolable rows: `expect_or_drop` plus quarantine. Contract whose violation invalidates the result: `expect_or_fail`.",
    "checkpoint": {
      "question": "Which action retains invalid rows but produces metrics?",
      "answer": "`expect`; neither drops the row nor fails the update."
    }
  },
  "m19-l2": {
    "summary": "A useful quarantine preserves the row, source, broken rule, and version so that it can be corrected and reprocessed.",
    "explanation": [
      "Dropping with an expectation does not automatically create a quarantine table. The explicit pattern classifies a common view into valid and invalid output. The invalid branch adds `failure_reasons`, timestamp, source file or offset, and pipeline version; The valid branch applies the same complementary conditions.",
      "Quarantine needs access policy because it may contain PII, retention, and a remediation flow. Reinjecting corrected data directly into silver skips traceability; It is advisable to publish a new entry with a stable identity or a correction table that follows the same rules."
    ],
    "deepDive": {
      "mentalModel": "Quarantine does not mean a folder where bad data disappears; It is an operational product with identity, provenance, cause, status and re-entry route. The most explainable pattern evaluates rules once, adds a map or array of violations, and splits the DataFrame into valid and invalid. The quarantine row preserves original payload, parsed fields, source, coordinate, contract version, detection time, and rule names. A repair produces a new version or event, it does not silently modify the evidence. Re-entry uses the same business key and idempotence to avoid duplicating the target. Data may contain PII, so quarantine needs access and retention controls at least as strict as production. Its metrics reveal debt: incoming volume, age, corrected percentage and recurring causes with owner.",
      "mechanics": [
        "Rules are materialized as boolean columns or a `failed_rules` collection. Valid flow filters rows without failures and applies appropriate expectations; another flow selects the invalid ones and writes a quarantine streaming table with metadata. Both are derived from the same parsed layer to avoid discrepancies due to duplicate logic. A remediation process reads pending records, adds approved fixes, and publishes them to a replay entry; the target uses `MERGE` or CDC for stable identity. The original record remains unchanged for auditing.",
        "Duplicating sensitive payloads increases risk surface and cost; Fields are minimized or tokenized when research does not need full text. A quarantine without SLA accumulates millions of rows and becomes a sink. A systemic error that affects a large proportion should not continue to degrade: thresholds convert the rate into a failure or incident. Reprocessing the target directly by omitting the original rules creates a bypass; Every correction goes through a versioned contract and records who, how and from what version authorized it."
      ],
      "concepts": [
        {
          "term": "Provenance",
          "definition": "Metadata that identifies the origin, position, version, and transformation by which a row reached the quarantine decision.",
          "whyItMatters": "It allows you to reproduce the failure, locate responsible producers and demonstrate that a correction corresponds to the exact record."
        },
        {
          "term": "Remediation status",
          "definition": "Explicit cycle of an anomaly, for example pending, investigated, corrected, discarded or re-entered with reference to evidence.",
          "whyItMatters": "It turns quarantine into a governed queue and allows measurement of debt and compliance with resolution times."
        },
        {
          "term": "idempotent reentry",
          "definition": "Process that returns a corrected row to the canonical flow without creating more than one entity or applying the same change twice.",
          "whyItMatters": "Prevents quality fixes from introducing duplicates and maintains an auditable history of the repair."
        }
      ],
      "workedScenario": {
        "situation": "A healthcare integration receives malformed identifiers along with sensitive clinical fields; Compliance requires fixing legitimate cases within 24 hours without exposing payloads to the entire team.",
        "reasoning": [
          "Create a governed quarantine table that preserves coordinate, rules, version and only the minimum necessary fields, restricted to the authorized group.",
          "Assign owner and status, alerting by age and rate, while the valid flow continues only if the percentage remains below the agreed threshold.",
          "Publish signed fixes using an idempotent entry that re-executes the contract and links result to the original immutable record."
        ],
        "outcome": "The organization repairs data on time with minimal access, preserves complete evidence, and prevents quarantine from being a dumping ground or backdoor."
      }
    },
    "keyPoints": [
      "Valid and invalid should be derived from a single classification to avoid gaps.",
      "Each invalid row retains sufficient evidence for diagnosis and replay.",
      "Remediation re-enters through a governed border and avoids double counting."
    ],
    "decisions": [
      "Valid and invalid should be derived from a single classification to avoid gaps.",
      "Each invalid row retains sufficient evidence for diagnosis and replay.",
      "Remediation re-enters through a governed border and avoids double counting."
    ],
    "example": {
      "title": "Classification with reasons for rejection",
      "note": "Use a shared function so that the valid condition is exactly the complement of the quarantine."
    },
    "pitfalls": [
      "Define separate filters for valid and invalid and leave rows that do not fall into any branch.",
      "Save only a count of errors, without payload or source to repair them."
    ],
    "examDecision": "If the requirement asks to investigate or recover invalids, a drop expectation is not enough: it materializes a quarantine branch with reasons and origin.",
    "checkpoint": {
      "question": "Which property prevents losing or duplicating rows between silver and quarantine?",
      "answer": "That both branches come from a common classification and use complementary conditions on the same list of reasons."
    }
  },
  "m19-l3": {
    "summary": "The pipeline event log is the structured source for progress, quality, lineage, and errors, and should be queried using documented fields.",
    "explanation": [
      "`flow_progress` events include status, metrics, and `data_quality` within `details`. `origin` identifies pipeline, update and flow. The `event_log(TABLE(...))` function allows you to consult the log associated with a table in the pipeline from SQL and build trends by expectation.",
      "Not every internal field is a public contract. Operational queries select documented fields and tolerate the absence of metrics on non-progress events. Preserving `update_id`, flow name and timestamp allows a quality drop to be related to deployment and batch."
    ],
    "deepDive": {
      "mentalModel": "The pipeline event log is the structured log of a declarative execution. Log update events, flows, progress, quality, lineage, configuration, and errors with a documented schema and JSON fields for details. It is not a business table nor should it depend on undocumented internal fields, because they can change. The reading begins by identifying update and flow, sorting by the sequence of the event and extracting only supported structures. An isolated row rarely tells the whole story: start, progress, and end of the same update are correlated. Publishing the event log as a Unity Catalog table facilitates permissions, retention, and cross-pipeline queries. The `warn` and `drop` expectations produce queryable metrics; a `fail` violation aborts and may not register equivalent counters, so the flow error is combined with input data and logs.",
      "mechanics": [
        "Each event includes identity, timestamp, level, type, origin, sequence and a `details` field whose content depends on the class. Queries filter supported types and use JSON operators to project flow progress or quality metrics. Grouping by `update_id`, `flow_id` and expectation allows you to calculate approved, failed and rate rows. Lineage events link sources and targets. Semantic order uses the documented sequence, it does not rely only on timestamps that may match or come from distributed components.",
        "The event log can grow and contain sensitive operational information; Retention, privileges, and consumer views apply. Alerts should not query full JSON without filters or use `SELECT *` as a contract. A field empirically observed but not documented is treated as internal. For long-term metrics, it is transformed into its own stable model with versioning. The absence of events can mean a stopped pipeline or publication problem; an external sign of execution helps differentiate. A link to the raw event is always kept for research."
      ],
      "concepts": [
        {
          "term": "Update",
          "definition": "Identifiable instance of pipeline update that groups planning, flow execution and final result under the same operation.",
          "whyItMatters": "It is the correct unit to correlate events and avoid mixing metrics from concurrent or successive executions."
        },
        {
          "term": "Event sequence",
          "definition": "Structured metadata that allows ordering and relating distributed pipeline events more reliably than an isolated timestamp.",
          "whyItMatters": "It makes it possible to reconstruct causality during failures and distinguish earlier progress from later shutdown messages."
        },
        {
          "term": "Documented field",
          "definition": "Schema attribute that Databricks declares suitable for client consumption and whose semantics are officially published.",
          "whyItMatters": "Reduces breakages by avoiding dashboards dependent on internal details that can change without a public contract."
        }
      ],
      "workedScenario": {
        "situation": "After a deployment, the discarded row rate increases in only one of eight flows and the current dashboard mixes data from several simultaneous updates.",
        "reasoning": [
          "Filter quality events by documented type and group them by `update_id`, flow and expectation before calculating any rates.",
          "Correlate the change with pipeline version and progress events, preserving sequence to reconstruct the actual order of the update.",
          "Materialize a stable operational table with controlled dimensions and link to the raw event log for alerts and subsequent detailed analysis."
        ],
        "outcome": "The team locates the responsible rule and flow without mixing executions, and obtains a supported basis for long-lasting trends and alerts."
      }
    },
    "keyPoints": [
      "Filters `event_type = 'flow_progress'` before interpreting flow metrics.",
      "The `details` JSON is parsed with documented paths and explicit types.",
      "Event log complements, not replaces, a business reconciliation."
    ],
    "decisions": [
      "Filters `event_type = 'flow_progress'` before interpreting flow metrics.",
      "The `details` JSON is parsed with documented paths and explicit types.",
      "Event log complements, not replaces, a business reconciliation."
    ],
    "example": {
      "title": "Quality inspection in the event log",
      "note": "Normalizes the array of expectations in an operational view to calculate rates per rule and update."
    },
    "pitfalls": [
      "Query any event as if it contained `flow_progress` and generate nulls that are difficult to interpret.",
      "Build permanent dependencies on undocumented internal JSON fields."
    ],
    "examDecision": "To find out how many rows violated an expectation or why a flow failed, see event log; Jobs history only indicates the result of the enveloping task.",
    "checkpoint": {
      "question": "What event typically contains the expectations metrics?",
      "answer": "`flow_progress`, within the documented section `details.flow_progress.data_quality`."
    }
  },
  "m19-l4": {
    "summary": "A quality contract defines dimension, expression, action, threshold, owner and remediation procedure before writing code.",
    "explanation": [
      "Validity, completeness, uniqueness, consistency, timeliness and accuracy require different evidence. `amount >= 0` checks validity, but not accuracy against the payment system. A row-by-row expectation also does not demonstrate global uniqueness without proper transformation or aggregation.",
      "Rules evolve as versioned code. A threshold change must review historical impact and deployment; renaming an expectation breaks series of metrics. Critical rules can be grouped with `expect_all_or_fail`, while observation rules use `expect_all` for a shared configuration."
    ],
    "deepDive": {
      "mentalModel": "A quality contract connects business meaning with an executable expression and an operational response. For each rule, it documents dimension—validity, completeness, uniqueness, consistency, punctuality—, scope, expression, tolerance, action, owner, evidence, and remediation procedure. An expectation only implements the part per row; a global unique key, cross-table reconciliation, or freshness require additional aggregate controls. Thresholds should be based on risk: zero may be correct for primary identity, but absurd for an optional attribute with imperfect source. Versioning the contract allows you to explain why a rate changed and revalidate history. Before writing code, limit examples, nulls, time zones and schema evolution are tested. Separating an action rule makes it possible to first observe a new constraint, calibrate it and harden it without modifying its meaning.",
      "mechanics": [
        "The team defines the population and denominator: for example, production orders received in a window, excluding identified tests. The rule is expressed in deterministic SQL and assigned a stable name. A row level is implemented as an expectation; an aggregate check runs afterwards and publishes results to a quality table. The policy maps severity and rate to warn, quarantine or fail. The metadata includes owner and link to the runbook, so that the alert does not end up on a generic computer.",
        "A silently changing rule invalidates historical comparisons; A version is introduced and executed in shadow to estimate impact. The percentage alone can hide a loss concentrated in a critical country, so it is segmented by limited risk dimensions. Failure due to an external dependency without degraded mode propagates unavailability. On the other hand, tolerating by budget does not mean discarding without traceability. The contract defines when a sustained rate consumes budget and when a single high-impact row is enough to stop."
      ],
      "concepts": [
        {
          "term": "Quality dimension",
          "definition": "Semantic category that describes what property is evaluated, such as completeness, validity, consistency, uniqueness, or timeliness of the data.",
          "whyItMatters": "It avoids disjointed lists of expressions and helps verify that the product covers relevant risks."
        },
        {
          "term": "Denominator",
          "definition": "Exact population on which a compliance rate is calculated, with defined inclusions, exclusions and time window.",
          "whyItMatters": "Prevents misleading metrics whose percentage changes due to mixing test data, replays or non-comparable segments."
        },
        {
          "term": "Versioned contract",
          "definition": "Identifiable specification of rules, thresholds, actions, and ownership valid for a version of the data product.",
          "whyItMatters": "It allows you to audit changes, run shadow rules, and attribute variations to data or definitions."
        }
      ],
      "workedScenario": {
        "situation": "A global platform wants to declare 99.5% valid addresses, but pickup orders have no address and a critical country uses a different format.",
        "reasoning": [
          "Define the denominator only on orders that require shipping and segment the critical country so as not to hide its risk in the global average.",
          "Version expressions by format, run the new rule in observation mode and review false positives with local owners.",
          "Assign quarantine and sustained threshold for repairable cases, reserving fail for losses that prevent the order from being correctly identified or collected."
        ],
        "outcome": "The indicator begins to measure the correct population and governs proportional responses, with a traceable evolution that does not confuse rule change with real degradation."
      }
    },
    "keyPoints": [
      "Each expression must measure the dimension it claims to measure.",
      "Action and threshold are part of the contract, they are not implementation details.",
      "Stable names allow you to compare quality between versions and updates."
    ],
    "decisions": [
      "Each expression must measure the dimension it claims to measure.",
      "Action and threshold are part of the contract, they are not implementation details.",
      "Stable names allow you to compare quality between versions and updates."
    ],
    "example": {
      "title": "Versionable rules dictionary",
      "note": "Grouping expressions facilitates reuse, but documents the action and owner of each group separately."
    },
    "pitfalls": [
      "Calling 'accuracy' a formatting check that does not compare with an authoritative source.",
      "Change rule names in each release and lose continuity of the indicator."
    ],
    "examDecision": "Before choosing expectation, identify whether the rule is row-by-row, aggregate, or reconciliation; Not every dimension fits in one SQL predicate per record.",
    "checkpoint": {
      "question": "Can `amount >= 0` prove that the amount charged is accurate?",
      "answer": "No; demonstrates range validity. Accuracy requires comparison with an authoritative source, such as the payment system."
    }
  },
  "m19-l5": {
    "summary": "Quality operation converts event log metrics into rates, sustained alerts, and stop, downgrade, or remediation decisions.",
    "explanation": [
      "An absolute count of invalids confuses volume growth with degradation. The `failed / (passed + failed)` rate for expectation, flow and window allows comparison. For critical rules, a single violation can fail; for gradual quality, a threshold held over several updates avoids noise.",
      "The alert includes safe sample rows, link to update and owner. If the rate increases after a deployment, a rollback is decided; if it comes from a specific producer, it is isolated by `source_system`. The remediation is verified with the same indicator until the incident is closed."
    ],
    "deepDive": {
      "mentalModel": "Operating quality means converting events and rules into sustained decisions. The counters of an expectation are transformed into rates using passed plus failed as the denominator, added by update and compared with baselines and SLO. A single invalid row can be critical if it affects identity; millions may be tolerable if they belong to an optional field during an agreed migration. That is why alerts combine severity, proportion, absolute volume, duration and segment. The event log shows what happened within the pipeline; A stable quality table preserves trends, owners, and incident status. The full cycle includes detecting, containing, diagnosing, remediating, re-entering and preventing recurrence. Changing an expectation from drop to warn to make a Job green does not solve the problem: it consumes or redefines a risk and requires contract approval.",
      "mechanics": [
        "An operational task extracts documented metrics from the event log, groups by update, flow, and expectation, and calculates rates with protection against zero denominators. It joins them with a catalog of rules to obtain severity, owner and threshold. Moving and consecutive windows avoid noise alerts, while a critical rule can trigger immediately. Alerts include code version, safe samples, affected volume, and link to quarantine or runbook. A dashboard shows budget consumed and age of open anomalies.",
        "Adaptive baselines help with seasonality, but should not replace contractual limits. An increase in drop can preserve target while reducing completeness; therefore the SLI of the product must reflect it. Fail preserves the last good state but increases staleness, creating a tradeoff between correctness and freshness. The response can pause downstream publishing, activate degraded mode, or allow tagged continuity. After repairing, rows are reprocessed idempotently and verification is made that metrics return to normal without deleting evidence of the incident."
      ],
      "concepts": [
        {
          "term": "Rape rate",
          "definition": "Proportion of failed records compared to the total evaluated for a clearly identified comparable rule, update and population.",
          "whyItMatters": "It normalizes volumes, but must be accompanied by absolute counting and criticality to assess the real impact."
        },
        {
          "term": "Quality budget",
          "definition": "Agreed amount of non-compliance tolerable during a window before stopping, downgrading or escalating the product.",
          "whyItMatters": "It makes the balance between availability and correctness explicit and avoids improvised decisions during incidents."
        },
        {
          "term": "Degraded mode",
          "definition": "Defined operational state that maintains part of the service while labeling, limiting, or delaying results affected by a known anomaly.",
          "whyItMatters": "It can preserve utility without presenting incomplete data as normal, as long as consumers understand the signal."
        }
      ],
      "workedScenario": {
        "situation": "An expectation begins to discard 3% of orders after an upstream change; The table remains available, but commercial reports show an artificial drop in sales.",
        "reasoning": [
          "Alert for sustained rate and volume, relate the jump to upstream version and declare completeness impact even if the pipeline remains green.",
          "Contain the publication of the report or mark it downgraded, while the rows kept in quarantine allow the new format to be diagnosed.",
          "Deploy corrected parser, re-enter by idempotent key and verify sales reconciliation and budget recovery before closing."
        ],
        "outcome": "The operation protects consumers from a misleading figure, repairs lost data and preserves a quantifiable history of the incident and its resolution."
      }
    },
    "keyPoints": [
      "Normalize by volume and preserve numerator/denominator.",
      "Segment by source or version to locate the source of a regression.",
      "An alert is closed when the indicator and repaired data return to target."
    ],
    "decisions": [
      "Normalize by volume and preserve numerator/denominator.",
      "Segment by source or version to locate the source of a regression.",
      "An alert is closed when the indicator and repaired data return to target."
    ],
    "example": {
      "title": "Rape rate per rule",
      "note": "Define the threshold and minimum non-compliance duration in the runbook, not within an ad hoc query."
    },
    "pitfalls": [
      "Alert only by count and generate false positives when the volume grows.",
      "Show payload with PII in the notification instead of linking to a restricted view."
    ],
    "examDecision": "For an operable quality alert, use rate per rule and window, source and owner segmentation; a manual capture of the UI is not monitoring.",
    "checkpoint": {
      "question": "Why is it better to alert by rate than just by number of failures?",
      "answer": "Because it relates failures to total volume and allows us to distinguish normal growth from real proportional degradation."
    }
  },
  "m20-l1": {
    "summary": "The Lakeflow Jobs DAG expresses execution dependencies and allows parallelism only when tasks and data are truly independent.",
    "explanation": [
      "Each task has a responsibility, parameters and observable result. Two regional ingests can run in parallel if they write separate partitions or targets; gold publishing depends on both. Introducing unnecessary dependencies lengthens the critical path, but removing a data dependency creates races.",
      "The DAG should not hide transformation logic within dozens of notebooks. Jobs coordinates deployable units—pipeline, wheel, SQL or notebook—and tasks share information through parameters, task values ​​or outputs, not driver memory variables."
    ],
    "deepDive": {
      "mentalModel": "A Lakeflow Job is a graph of tasks, not a visual list of notebooks. Each edge declares a dependency condition and the scheduler executes in parallel only the branches whose prerequisites are satisfied. The DAG should reflect real data dependencies and effects: two tasks writing the same table are not independent even if they do not read each other, and an unnecessary edge wastes parallelism. The unit of retry, timeout, compute, parameters and observability is the task; That is why it should be cohesive and idempotent. A Job can orchestrate notebooks, Python scripts, pipelines, SQL, and other types, but it does not make its content end-to-end transactional. The architecture separates produce, validate, and publish so that a failure does not expose partial data. Names and task keys are operational contracts because they appear in dynamic references, repair runs, alerts and system tables.",
      "mechanics": [
        "When starting a run, the scheduler materializes the configured version of the graph and marks eligible tasks. A task starts when its dependencies and `Run if` condition are met; Non-dependency branches can run simultaneously with shared or separate compute depending on configuration. Each result remains in a terminal state that feeds downstream decisions. A pipeline task waits for the managed update; one of notebook finishes according to its process. The Job concludes when all applicable tasks reach states compatible with the overall result.",
        "Parallelizing reduces critical duration, but increases concurrency on warehouses, APIs and targets. Sharing job compute amortizes startup and facilitates caching, although a failure or library dependency can affect several tasks; Isolated compute reduces interference at higher cost. A huge task limits repair and visibility; fragmenting each statement multiplies overhead. The critical path is measured in real runs and dependencies are reviewed for changes. For atomic publishing, branches write staging and a final task validates and switches a view or performs controlled commit."
      ],
      "concepts": [
        {
          "term": "task key",
          "definition": "Stable and unique identifier of a task within the Job, used by dependencies, dynamic references, metrics, and repair operations.",
          "whyItMatters": "Changing it without planning can break downstream parameters and historical comparability even if the display name seems equivalent."
        },
        {
          "term": "Critical path",
          "definition": "Dependent sequence of tasks whose cumulative duration determines the minimum possible time to complete the entire run.",
          "whyItMatters": "It helps optimize where you actually reduce SLA, rather than throttling branches that already finish early."
        },
        {
          "term": "Effect dependence",
          "definition": "Relationship not visible only by reads, created when tasks compete for the same target, external resource or publication.",
          "whyItMatters": "It must be represented or removed by isolation to prevent non-deterministic races and outcomes."
        }
      ],
      "workedScenario": {
        "situation": "A Daily Job loads sales and customers in parallel, but both tasks update a shared metrics table before a third publishes the executive report.",
        "reasoning": [
          "Separate the loads so that each branch writes independent targets or staging and declare only truly necessary data dependencies.",
          "Add validations per branch and make the publication depend on all of them, avoiding concurrent writes to the same final table.",
          "Measure the critical path and choose shared or isolated compute based on libraries, startup, and containment demonstrated during realistic load runs."
        ],
        "outcome": "The DAG exploits secure parallelism, eliminates the write race, and provides a final publishing frontier that can be repaired without repeating healthy work."
      }
    },
    "keyPoints": [
      "Dependencies represent data/state requirements, not visual preference.",
      "Independent tasks can use separate compute and retries.",
      "The critical path determines the minimum latency of the workflow."
    ],
    "decisions": [
      "Dependencies represent data/state requirements, not visual preference.",
      "Independent tasks can use separate compute and retries.",
      "The critical path determines the minimum latency of the workflow."
    ],
    "example": {
      "title": "Explicit parallelism and convergence",
      "note": "In the actual bundle use the substitution syntax `${resources.pipelines.orders.id}`; here the sign is escaped to keep the example as text."
    },
    "pitfalls": [
      "Serialize independent tasks and increase time/cost without improving correctness.",
      "Execute tasks in parallel that overwrite the same table range."
    ],
    "examDecision": "Add a dependency only if an actual precondition exists; for independent branches, it parallelizes and converges to a downstream task.",
    "checkpoint": {
      "question": "What determines the critical path of a Job?",
      "answer": "The longest dependent chain; Speeding up a task out of that chain doesn't necessarily reduce the total time."
    }
  },
  "m20-l2": {
    "summary": "Job parameters, task values, and dynamic references move context between tasks without coupling them to notebook state.",
    "explanation": [
      "Job parameters describe run inputs and are propagated to compatible tasks. A task can post a small value using `dbutils.jobs.taskValues.set`; downstream references it as `{{tasks.<task>.values.<key>}}`. References are replaced as text, they do not evaluate expressions.",
      "Task values are used for counters, routes or small lists, not for transporting DataFrames. Voluminous data is materialized into tables/Volumes and an identifier is passed. A misspelled name can be treated as literal, so bundle validation and a smoke test are essential."
    ],
    "deepDive": {
      "mentalModel": "Parameters describe execution intent; task values ​​carry small results calculated during that execution; dynamic references link both without copying state to notebooks. A job parameter like `business_date` or `environment` must have a type and conceptual validation, even if it arrives as text. It can be propagated to tasks via configuration, while `dbutils.jobs.taskValues.set` publishes a value to a downstream task or an `If/else`. Not a data store: large payloads belong to tables, Volumes or object storage and are passed by reference. `{{...}}` references are resolved by the service before executing the task and some do not fail if misspelled, so they should be reviewed and tested. Secrets never travel as visible parameters. The contract includes safe default, timezone, format, origin and rerun behavior so that a repair uses the same logical interval.",
      "mechanics": [
        "When triggering the Job, the supplied values are combined with trigger defaults and references. The scheduler substitutes dynamic references in parameters of each task. During execution, a task can publish a `taskValue` identified by task key and key; a downstream queries it explicitly or uses it in a condition. The value is tied to the run and should not be assumed available in another. Large data is materialized in a table with a `run_id`, and the task value carries only that identity or a count.",
        "Reusing global widgets or getting `current_date()` on each notebook can cause a next-day repair to process another window. The Job calculates and passes an immutable interval from the trigger. Useful defaults in development can be dangerous in production if they point to the wrong catalog. References are validated with a test run and observing resolved parameters, without registering secrets. An absent task value needs a clear branch or bug; Using a silent fallback can publish data even though the producing task has not computed its control."
      ],
      "concepts": [
        {
          "term": "Job parameters",
          "definition": "Entry defined at the Job scope that sets up an execution and can be propagated consistently to multiple tasks.",
          "whyItMatters": "Centralizes date, environment or mode and makes normal, manual runs, backfills and repairs reproducible."
        },
        {
          "term": "task value",
          "definition": "Small value produced during a task and exposed by key to subsequent conditions or tasks within the same run.",
          "whyItMatters": "It allows you to communicate decisions and references without coupling notebooks to global variables or implicit temporary files."
        },
        {
          "term": "Dynamic reference",
          "definition": "Template resolved by Lakeflow Jobs with run context, trigger, parameters, tasks or metadata officially available.",
          "whyItMatters": "It connects declarative configuration with executable values, but requires verified syntax and scope to avoid accidental literals."
        }
      ],
      "workedScenario": {
        "situation": "A financial close must exactly reprocess the original date during a next-day repair and publish the validated entry count.",
        "reasoning": [
          "Calculate `business_date` once as a run parameter and prohibit notebooks from replacing it with the current clock during execution or repair.",
          "Persist entries with `run_id` and publish only count and staging reference using small task values.",
          "Make validation and publishing fail clearly if the required value does not exist, preserving resolved parameters for auditing without secrets."
        ],
        "outcome": "The repair preserves the exact accounting period and communicates controls explicitly, without depending on notebook state or transporting datasets in parameters."
      }
    },
    "keyPoints": [
      "Job parameter identifies the run; task value communicates a small upstream result.",
      "Dynamic references use double curly braces and do not execute code.",
      "Large data is shared using governed storage, not DAG values."
    ],
    "decisions": [
      "Job parameter identifies the run; task value communicates a small upstream result.",
      "Dynamic references use double curly braces and do not execute code.",
      "Large data is shared using governed storage, not DAG values."
    ],
    "example": {
      "title": "Publishing evidence for a condition",
      "note": "The downstream reference `{{tasks.validate.values.invalid_ratio}}`; preserves the detail of rows in a table, not in the task value."
    },
    "pitfalls": [
      "Passing thousands of rows as JSON in a task value and hitting size limits.",
      "Using a non-existent dynamic reference and not detecting that it remained as literal text."
    ],
    "examDecision": "For a scalar computed by upstream use task value; for run input use job parameter; for datasets use a table or Volume.",
    "checkpoint": {
      "question": "How does downstream consume the `invalid_ratio` value published by `validate`?",
      "answer": "By dynamically referencing `{{tasks.validate.values.invalid_ratio}}` on a supported field or parameter."
    }
  },
  "m20-l3": {
    "summary": "If/else decides on a value; Run if decides for the state of upstream tasks and both solve different problems.",
    "explanation": [
      "An If/else task compares parameters, dynamic values or task values with operators such as `>`, `==` or `!=`. For example, publish if `invalid_ratio <= 0.01` and send to quarantine otherwise. The tasks of each branch declare the required outcome.",
      "`Run if` is set on a dependency to run cleanup, notification, or recovery based on states like `ALL_SUCCESS`, `AT_LEAST_ONE_FAILED`, or `ALL_DONE`. You should not hardcode a business value as task status or use If/else to find out if upstream threw an exception."
    ],
    "deepDive": {
      "mentalModel": "`If/else` and `Run if` control different dimensions. The If/else task compares a value—parameter, dynamic reference, or task value—with an operator and opens a true or false branch. `Run if` evaluates terminal states of dependencies, such as all successful, at least one failed, or all finished, and decides whether a downstream task is applicable. Confusing them produces brittle DAGs: checking `row_count > 0` is decision by value; Executing cleanup even if upstream fails is a state decision. Skipped tasks acquire states that influence dependents, so each path is designed and tested, including missing data. A conditional branch is no substitute for transactional validation: publishing because a flag says true requires trusting who computed that flag and preserving evidence. Cleanup tasks use `All done`, but must be idempotent and not hide the original failure.",
      "mechanics": [
        "A producer task sets a serializable task value. If/else evaluates one of the supported operators and the scheduler enables the corresponding dependency; tasks from the other branch are excluded. Separately, each downstream task sets `Run if` on the states of its upstreams. A failure notification can use `At least one failed`; a teardown uses `All done`; publishing usually requires `All succeeded`. The result of the Job retains the fault even if a management task is executed correctly, depending on the topology and states.",
        "Numerical and string comparisons must respect types and formats; an unnormalized date or textual boolean may take the wrong branch. A condition should never depend on free error messages. Less frequent routes often go untested and accumulate invalid permissions or parameters. Fixture runs are created for true, false, upstream failed and skipped. Error tasks write diagnostics and alerts, but do not convert corruption to success. If the conditional logic grows too large, separate Jobs or model a governed control table."
      ],
      "concepts": [
        {
          "term": "If/else task",
          "definition": "Control task that compares an available value with a supported operator and enables one of two branches of the DAG.",
          "whyItMatters": "Expresses business or data decisions, such as only publishing when a count exceeds a threshold."
        },
        {
          "term": "Run if",
          "definition": "Condition associated with dependencies that decides execution based on upstream task states, including success, failure, or completion.",
          "whyItMatters": "It allows cleanup, notification and partial tolerance without converting technical states into invented values."
        },
        {
          "term": "Omitted route",
          "definition": "Set of tasks that the scheduler does not execute because a condition chose another branch or its dependencies do not apply.",
          "whyItMatters": "It must be tested because its state influences downstream and can hide that a rare alternative was never validated."
        }
      ],
      "workedScenario": {
        "situation": "A pipeline should publish if the reconciliation returns zero differences, alert if any exist, and clean up staging both when the upload works and when it fails.",
        "reasoning": [
          "Use If/else on the numerical task value of differences to separate publication and quality alert, preserving the query that produced it.",
          "Configure publishing with successful dependencies and cleanup with `All done`, without allowing cleanup or alert to hide an upstream failure.",
          "Test runs with zero, positive value and loading error, verifying statuses of executed and omitted tasks and overall result of the Job."
        ],
        "outcome": "Control distinguishes decisions from state management data, covers error paths, and keeps the root cause visible while safely releasing resources."
      }
    },
    "keyPoints": [
      "If/else evaluates data or parameters; Run if evaluates execution result.",
      "A cleanup task usually uses `ALL_DONE` to run even after failures.",
      "The branches must converge with conditions that accept expected outcomes."
    ],
    "decisions": [
      "If/else evaluates data or parameters; Run if evaluates execution result.",
      "A cleanup task usually uses `ALL_DONE` to run even after failures.",
      "The branches must converge with conditions that accept expected outcomes."
    ],
    "example": {
      "title": "Condition based on quality",
      "note": "Post or quarantine downstream tasks depend on `quality_gate` with the corresponding true or false outcome."
    },
    "pitfalls": [
      "Use If/else to catch glitches when `Run if` already models upstream states.",
      "Forgetting a branch or convergence and leaving the Job apparently correct but incomplete."
    ],
    "examDecision": "Calculated value determines route: If/else. Success, failure or upstream completion determines path: Run if.",
    "checkpoint": {
      "question": "What condition would you use to release a resource whether upstream succeeded or failed?",
      "answer": "A dependency on Run if `ALL_DONE`, not an If/else comparison of a task value."
    }
  },
  "m20-l4": {
    "summary": "For each runs a nested task per element with limited concurrency and requires each iteration to be isolable and idempotent.",
    "explanation": [
      "The list can come from a job parameter, task value or SQL output and each element is referenced with `{{input...}}`. Processing regions or dates in parallel reduces latency, but concurrency must respect the limits of the source, compute and destination system.",
      "Each iteration writes a separate partition or key. If they all overwrite the entire table, the loop creates races. For thousands of items, ranging or using a distributed Spark transformation is often better than creating thousands of task runs."
    ],
    "deepDive": {
      "mentalModel": "The `For each` task expands a collection into iterations of a nested task and limits how many are executed simultaneously. It is appropriate when each element—date, region, table—can be processed in isolation and idempotently. It is not a general substitute for Spark parallelism: launching thousands of tasks for partitions of the same DataFrame adds scheduler and compute overhead that a single distributed Job would better resolve. The collection must be bounded, validated, and small enough for Jobs limits and dynamic references. Each iteration receives the current element and must write to a namespace or key that avoids collisions. Concurrency is set according to API quotas, warehouse capacity and targets, not according to the maximum available. If an iteration fails, repair and retries should be able to repeat only that unit without disturbing the already committed ones.",
      "mechanics": [
        "Inputs can come from parameters or task values in a supported format. The scheduler creates an instance of the nested task per element, injects its value by reference, and maintains it up to the concurrency limit. Each instance maintains state and logs, which allows the failed element to be located. A downstream waits for the completion of the container based on its condition. The large results of each iteration are written to tables with `run_id` and item key, not concatenated as huge task values.",
        "A duplicate list can execute the same unit twice, so it is normalized and validated before the loop. High concurrency can cause 429s, database locks, or overwhelm a SQL warehouse even though Jobs can launch the tasks. Compute new per iteration multiplies bootstrap; Shared compute reduces cost but may have insufficient isolation. The logic uses upsert or deterministic partitioning and avoids blind append. For millions of items, repartitioned Spark is used; For each is reserved for dozens or hundreds of heterogeneous operating units."
      ],
      "concepts": [
        {
          "term": "Nested task",
          "definition": "Runnable definition that For Each instantiates once per element, with resolved parameters and observable state for that iteration.",
          "whyItMatters": "It concentrates repeatable logic and allows a specific unit to be repaired without duplicating the entire orchestration."
        },
        {
          "term": "Loop Concurrency",
          "definition": "Maximum number of For Each iterations that Lakeflow Jobs allows to run simultaneously within the active run.",
          "whyItMatters": "Protects downstream services and compute and determines balance between duration, cost and risk of throttling."
        },
        {
          "term": "Insulation per element",
          "definition": "Property by which one iteration reads and writes identifiable resources without competing or implicitly depending on another.",
          "whyItMatters": "It is a requirement for safe parallelism, idempotence, and selective repair of failed iterations."
        }
      ],
      "workedScenario": {
        "situation": "A company recalculates 80 countries using an API that supports ten concurrent requests, and each result must uniquely replace its country partition.",
        "reasoning": [
          "Validate and deduplicate the list of countries, using each code as a parameter and identity from the output of the nested task.",
          "Limit For Each to ten or fewer iterations depending on latency and quotas, avoiding creating a task for each row returned.",
          "Write each partition idempotently with run metadata and test that repairing a failed country does not modify the 79 already committed."
        ],
        "outcome": "The loop respects the external quota, maintains traceability by country and allows selective repair without turning the orchestration into thousands of unnecessary tasks."
      }
    },
    "keyPoints": [
      "For each contains exactly one nested task that receives the current element.",
      "Concurrency limits simultaneous iterations and protects external dependencies.",
      "The body must be able to be retried per element without duplicating effects."
    ],
    "decisions": [
      "For each contains exactly one nested task that receives the current element.",
      "Concurrency limits simultaneous iterations and protects external dependencies.",
      "The body must be able to be retried per element without duplicating effects."
    ],
    "example": {
      "title": "Bounded regional processing",
      "note": "`regions` must be valid and small JSON; the notebook writes only the range of the received region."
    },
    "pitfalls": [
      "Set concurrency equal to the number of elements and saturate the API or source base.",
      "Use For Each for millions of rows that Spark can process in a single distributed DataFrame."
    ],
    "examDecision": "Use For each for a moderate collection of operating units; uses Spark for row-based parallelism and limits concurrency based on the most restrictive system.",
    "checkpoint": {
      "question": "What makes a partial repair of a For each safe?",
      "answer": "Let each iteration be isolated by key/range and idempotent, so retrying only the failed ones doesn't corrupt the successful ones."
    }
  },
  "m20-l5": {
    "summary": "Retries correct transient failures of a task; repair runs rerun the failed subset after correcting the cause without repeating successful work.",
    "explanation": [
      "A retry policy limits attempts and interval and should be reserved for plausibly transient failures. Retrying a deterministic schema violation only consumes time. Tasks with effects must be idempotent because both retry and repair can run them again.",
      "A repair run maintains the context of the original run and allows failed or skipped tasks to be re-executed, with parameters corrected where appropriate. Before repairing, error, input and version are inspected; The downstream result is then validated. A complete rerun is preferable if the scope changed or consistency with previous successful tasks cannot be guaranteed."
    ],
    "deepDive": {
      "mentalModel": "A retry automatically repeats a task in the event of a failure that is presumed to be temporary; A repair run is then started to reexecute failed or skipped tasks and their necessary dependents within an existing run. None corrects non-idempotent logic. The retry policy specifies number, interval and, when applicable, backoff; It must be short for network errors or recoverable capacity and to avoid storms over a downed service. A schema, permission, or deterministic quality error does not improve upon iteration and consumes RTO time. Repair preserves the context and parameters of the original run, so it is preferable to manually launching another Job that may use another date. Before repairing, the cause is corrected, it is understood which outputs were confirmed and the minimum safe subgraph is selected. Publishing and external effects need keys that tolerate repetition.",
      "mechanics": [
        "When a task fails, Jobs consults its retry configuration and creates another retry, preserving the task run's identity and parameters. If you exhaust attempts, dependent downstreams remain unexecuted based on conditions. From the interface or API, a repair run chooses unsatisfactory tasks; the scheduler reuses successful results when they are still valid and reexecutes the necessary subgraph. Logs and dynamic references can include attempt or repair number for correlation. In Jobs continuous, management incorporates retries with backoff depending on the behavior of the service.",
        "Immediately retrying an API with 429 amplifies throttling; backoff and jitter are used or concurrency is reduced. A task that does append without `run_id` duplicates rows in retry. A successful task may have produced a functionally defective result, and repair will not select it for quality alone; invalidation or new controlled run is needed. Changing parameters during repair breaks reproducibility. After repair, validations compare the complete state before running publish, and the postmortem decides whether to automate more accurate error classification."
      ],
      "concepts": [
        {
          "term": "Retry",
          "definition": "Automatic retry of the same task and context after failure, subject to configured limits and intervals.",
          "whyItMatters": "It recovers transient errors without intervention, but requires idempotence and classification to avoid repeating deterministic failures."
        },
        {
          "term": "Repair run",
          "definition": "Explicit resumption of an existing run that reexecutes the failed or dependent subset while preserving its original context.",
          "whyItMatters": "Reduces duplicate work and maintains logical date and parameters after correcting a cause."
        },
        {
          "term": "Backoff",
          "definition": "A strategy that increases the interval between trials, usually at random, to reduce pressure on a degraded dependency.",
          "whyItMatters": "Avoid coordinated storms of retries and improve the probability of service recovery with throttling."
        }
      ],
      "workedScenario": {
        "situation": "The publish task receives 429 after confirming staging; Two immediate retries fail and the team wants to relaunch the entire Job with the current date.",
        "reasoning": [
          "Maintain idempotent staging and classify 429 as transient, adjusting retry with backoff according to the external service quota.",
          "Fix only publishing and dependents from the original run to preserve `business_date`, without repeating successful loads.",
          "Validate that the idempotency key prevents double publishing if the provider accepted an attempt whose response was lost before the failure."
        ],
        "outcome": "The operation retrieves only the necessary subgraph with the original context and avoids both a storm of retries and duplicates at the external border."
      }
    },
    "keyPoints": [
      "Retry is automatic and close to failure; repair is a decision on an existing execution.",
      "Not all errors are temporary nor should they be retried.",
      "Idempotency allows you to reexecute a task without duplicating or rolling back state."
    ],
    "decisions": [
      "Retry is automatic and close to failure; repair is a decision on an existing execution.",
      "Not all errors are temporary nor should they be retried.",
      "Idempotency allows you to reexecute a task without duplicating or rolling back state."
    ],
    "example": {
      "title": "Limited retry policy",
      "note": "The code must be written with a request or `MERGE` key; three retries of a non-idempotent append can triple data."
    },
    "pitfalls": [
      "Configure unlimited retries for a permanent data error and hide the incident.",
      "Fixing downstream with different parameters without verifying that successful upstream outputs are still compatible."
    ],
    "examDecision": "Transient failure: bounded retry. Cause corrected within the same run: repair. Change of scope or incompatible outputs: new controlled run.",
    "checkpoint": {
      "question": "Why should a task that supports retries be idempotent?",
      "answer": "Because it may have produced some or all of the effect before failing and the next run must not duplicate it."
    }
  },
  "m21-l1": {
    "summary": "A trigger is chosen by the actual availability signal: calendar for temporary obligations, event for irregular arrivals and continuous execution for always active services.",
    "explanation": [
      "A schedule is appropriate when the business defines a cutoff, for example closing sales at 06:00 Europe/Madrid even if there are no files. The time zone must be explicit and DST changes can produce irregular intervals; UTC simplifies technical cadence, but may not coincide with the business day.",
      "A trigger per file or table avoids polling and empty runs when arrival is irregular. However, an event indicates that there was a change, not that a multi-file batch is complete. The pipeline preserves idempotence and consults its own data boundary instead of assuming that each trigger corresponds to a single batch."
    ],
    "deepDive": {
      "mentalModel": "A trigger should represent the signal that affirms that work exists, not the habit of executing every hour. A schedule expresses a temporary obligation even if there is no data; file arrival reacts to new objects in a governed location; table update reacts to commits of compatible datasets; continuous starts one run after another for always-on services. The signal does not replace idempotence: events can be grouped, repeated or arrive while another run is active. Nor does it alone determine the data window; The Job calculates reproducible limits from the trigger and its checkpoint or control table. Schedules incorporate timezone and daylight saving time; Event triggers incorporate waiting after the last change and minimum between executions. Choosing correctly reduces polling and idle computing, but requires understanding file event availability, permissions, and behavior when maximum concurrency is reached.",
      "mechanics": [
        "The scheduler registers the active configuration and, when satisfied, creates a run with trigger metadata accessible through supported dynamic references. A schedule uses expression and timezone; a file or table event builds up based on debounce/cooldown before launching. Continuous waits for the completion or failure of the previous run and starts the next one with its own retry behavior. By default, only one run can be active, and when maximum concurrency is exceeded, the runs can be queued or skipped depending on configuration and type.",
        "File arrival indicates the presence of objects, not that their content is complete or valid. Table update can be triggered by changes filtered later by a view and, when monitoring multiple tables, requires deciding any versus all. A schedule may be better for regulatory closures that must generate explicit empty output. Continuous offers low latency, but a poorly designed finite task can spin up without work and consume cost. Trigger references are registered as context, while processing maintains an independent idempotent boundary."
      ],
      "concepts": [
        {
          "term": "Schedule trigger",
          "definition": "Temporary rule with frequency and time zone that starts runs even when no source reports an arrival of data.",
          "whyItMatters": "It is appropriate for calendar obligations, but requires explicit management of windows, holidays, and daylight saving time."
        },
        {
          "term": "Event trigger",
          "definition": "Mechanism that initiates a run upon observing file arrival, table update or other supported and governed change.",
          "whyItMatters": "Reduces polling and idle latency, although the signal must be grouped and does not guarantee valid content."
        },
        {
          "term": "Continuous trigger",
          "definition": "Jobs mode that maintains service by starting a new run after finishing or failing the previous one with specific handling.",
          "whyItMatters": "It fits with always-on loads, but requires carefully controlled costs, retries, and worklessness."
        }
      ],
      "workedScenario": {
        "situation": "A regulatory report must be produced at 08:00 even if there are no operations, while partner ingestion arrives in irregular files throughout the day.",
        "reasoning": [
          "Maintain schedule with explicit timezone for the report, making an empty window a valid and auditable result.",
          "Use file arrival for ingestion with debounce and checkpoint, validating completeness of the file after receiving the signal.",
          "Separate both Jobs and register trigger references and data boundaries so that retries do not change the processed period."
        ],
        "outcome": "Each flow is activated by the reality it represents: temporal obligation for regulation and availability event for ingestion, both with reproducible processing."
      }
    },
    "keyPoints": [
      "Schedule expresses time; file/table update expresses observed availability.",
      "Time zone and DST are part of the contract for a calendar.",
      "Every trigger can coalesce or repeat signals; the task remains idempotent."
    ],
    "decisions": [
      "Schedule expresses time; file/table update expresses observed availability.",
      "Time zone and DST are part of the contract for a calendar.",
      "Every trigger can coalesce or repeat signals; the task remains idempotent."
    ],
    "example": {
      "title": "Schedule with zone and initial pause",
      "note": "Deploy the paused trigger to production, validate parameters and permissions, and activate it through the approved change process."
    },
    "pitfalls": [
      "Use the default local zone and discover that the Job changes time around DST.",
      "Schedule a source every minute that delivers a daily batch and generate 1,439 empty runs."
    ],
    "examDecision": "Obligation to an hour: schedule. Governed irregular arrival: file/table trigger. Service that must restart upon completion or failure: continuous, evaluating cost and semantics.",
    "checkpoint": {
      "question": "Why can't UTC always replace the business zone in a daily closing?",
      "answer": "Because the local day can change offset with DST and the requirement usually refers to a local time/calendar, not a fixed UTC time."
    }
  },
  "m21-l2": {
    "summary": "File arrival monitors an external location or Unity Catalog Volume and uses cooldown/debounce to convert multiple files into controlled runs.",
    "explanation": [
      "The trigger looks at a root or subpath and recursively checks for new arrivals. With managed file events in the external location, Databricks takes advantage of vendor notifications and reduces listing. The Job needs read permissions on the location and management of the Job.",
      "`wait_after_last_change_seconds` implements debounce: wait a period of no changes to group a batch. `min_time_between_triggers_seconds` limits frequency. None guarantee absolute completeness; Serious producers publish a manifest or marker and the code validates counts before promoting."
    ],
    "deepDive": {
      "mentalModel": "File arrival monitors an external location or Volume governed by Unity Catalog and converts object notifications into runs. With file events enabled in the external location, the platform uses provider events for efficiency and scalability; Without them you may depend on listing mechanisms with more limits. `Wait after last change` acts as a debounce: each arrival restarts the wait to group a burst. `Minimum time between triggers` limits frequency after a run. Neither guarantees that a file has been written correctly or that it belongs to the contract; Producers must publish atomically or accompany it with manifest. The Job should not rely only on the name received: Auto Loader or a control table keeps which files were processed. Duplicate or grouped events are normal and the load should converge.",
      "mechanics": [
        "The service monitors the authorized location, receives or discovers changes, and waits based on advanced settings. When you create the run, you don't necessarily produce one per file; an execution can span multiple arrivals. The task enumerates or consumes increments using a checkpointed source, validates size, schema, and manifest, and commits a bronze table. Cooldown prevents a cascade of runs when a producer loads thousands of parts. Unity Catalog credentials and permissions govern both monitoring and effective reading.",
        "Choosing an excessive wait increases freshness; a too short one initiates runs before completing a multipart delivery. Moving or rewriting objects can generate different events depending on the provider. Routes with huge cardinality need file events and reasonable partitioning. If a run lasts longer than the arrival rate, concurrency should remain controlled and the next run pick up the backlog from state, not process an ephemeral list. For massive backfills you can pause trigger and execute a separate parameterized load."
      ],
      "concepts": [
        {
          "term": "File events",
          "definition": "Storage change notifications configured in an external location to avoid repetitive listing and detect arrivals efficiently.",
          "whyItMatters": "They improve scale and latency of triggers and Auto Loader, but require configuration and permissions from the cloud environment."
        },
        {
          "term": "Debounce",
          "definition": "Wait to reset with each additional change to group a burst before starting a single run.",
          "whyItMatters": "Avoid processing incomplete multipart deliveries and reduce the overhead of numerous almost simultaneous runs."
        },
        {
          "term": "Manifesto",
          "definition": "Control file or record that declares parts, counts, checksums, and completeness of a logical delivery of data.",
          "whyItMatters": "It allows us to distinguish a visible arrival from a truly complete and safe dataset to publish."
        }
      ],
      "workedScenario": {
        "situation": "A partner delivers 2,000 files and a final manifest every hour; starting the first object publishes partial data and launching a run per file saturates the workspace.",
        "reasoning": [
          "Enable file events in the governed location and configure debounce to span the typical burst duration without exceeding the SLA.",
          "Require manifest and validate counts and checksums before confirming bronze, leaving the checkpoint as the authority of processed files.",
          "Limit concurrency and measure backlog; If a delivery is overdue, keep it pending rather than submitting an incomplete partition."
        ],
        "outcome": "Ingestion creates a run per logical delivery, checks completeness, and scales through events without relying on an exact trigger for each physical file."
      }
    },
    "keyPoints": [
      "The path must be governed by Unity Catalog as external location or Volume.",
      "Debounce groups bursts; cooldown limits consecutive runs.",
      "File events improve discovery, but idempotence still resides in the pipeline."
    ],
    "decisions": [
      "The path must be governed by Unity Catalog as external location or Volume.",
      "Debounce groups bursts; cooldown limits consecutive runs.",
      "File events improve discovery, but idempotence still resides in the pipeline."
    ],
    "example": {
      "title": "Arrival trigger with debounce",
      "note": "The example expects 60 seconds of calm and does not create runs less than 15 minutes apart."
    },
    "pitfalls": [
      "Point to an ungoverned or unpermissioned route and assume that the trigger inherits credentials from the notebook.",
      "Treat the first file as a full batch test when the producer publishes tens over several minutes."
    ],
    "examDecision": "For irregular files in UC use file arrival; configure debounce according to batch pattern and verify completeness through manifest if the source offers it.",
    "checkpoint": {
      "question": "What is the difference between cooldown and debounce?",
      "answer": "Cooldown limits the maximum frequency of runs; debounce waits for silence after the last change to group a burst before starting."
    }
  },
  "m21-l3": {
    "summary": "Table update starts a Job when Unity Catalog tables change and delivers the updated list as a dynamic reference for selective processing.",
    "explanation": [
      "This is useful when an upstream Delta release is the authoritative signal and you are not interested in looking at physical files. The trigger can monitor one or more tables and the downstream queries `{{job.trigger.table_update.updated_tables}}` to find out which ones changed since the previous run.",
      "The signal should not be converted to fragile logic per table without fallback. A Job can receive multiple coalesced updates and must read the committed state of each table. If transactional order is required between multiple tables, a separate trigger does not create that transaction; a publishing marker or coordinating layer is needed."
    ],
    "deepDive": {
      "mentalModel": "Table update trigger starts a Job when supported Unity Catalog tables or views change. It can monitor a single source or multiple sources and trigger when any one is updated (`Any`) or when all have changed (`All`). The signal refers to observed commits, not necessarily to rows relevant to the downstream query: a filtered view can be considered updated even if the change falls outside the filter. Dynamic references expose a list of updated tables and, depending on the case, version and commit timestamp; allow selective processing and auditing. `Wait after last change` and minimum between triggers group waves of commits. File events in the underlying locations improve performance and enable related capabilities. The Job still maintains a control table or checkpoints, because two commits can be grouped together and a notification does not exactly define the range consumed.",
      "mechanics": [
        "The trigger evaluates changes to configured objects and, upon fulfilling Any or All and the waits, creates a run. `{{job.trigger.table_update.updated_tables}}` provides a JSON list of objects changed since the previous run; other references offer commit version or timestamp for watched tables. A task can decide which branches to process, but it validates the input and persists the committed point after publishing. For supported views, the system observes dependencies, so an upstream change can trigger even if the visible result remains the same.",
        "All can lock indefinitely if a reference table rarely changes; Any can execute before two coordinated sources complete the same period. The upstream contract must define whether commits are independent or form a joint delivery. There are object limits per trigger and restrictions for some views or federated sources that must be checked. A loop caused by the job writing a table that indirectly activates its own trigger is avoided by separating monitored inputs from outputs and documenting lineage."
      ],
      "concepts": [
        {
          "term": "Updated tables reference",
          "definition": "Dynamic list of objects that the table update trigger observed as modified for the created run context.",
          "whyItMatters": "Allows you to skip unnecessary branches and preserve evidence of why the execution was started."
        },
        {
          "term": "Any versus All",
          "definition": "Policy that fires when at least one watched table changes or waits for all of them to register an update respectively.",
          "whyItMatters": "It must correspond to the upstream coordination contract to avoid premature or blocked runs."
        },
        {
          "term": "Commit signal",
          "definition": "Indication that a governed object recorded an update, regardless of whether all of its rows affect the downstream product.",
          "whyItMatters": "Avoid interpreting the trigger as a test of semantic change and justify your own filtering and checkpoint."
        }
      ],
      "workedScenario": {
        "situation": "A product combines daily sales and monthly exchange rates; using All would prevent 29 closures, while Any could unnecessarily recompute types every day.",
        "reasoning": [
          "Set Any for sales availability and treat rates as a current reference, not a simultaneous daily change requirement.",
          "Use updated tables and versions to decide which materialized views or validations need refreshing, preserving borders per source.",
          "Prove that writing outputs does not create a trigger cycle and that a filtered change does not alter results or duplicate publication."
        ],
        "outcome": "The Job reacts to sales without waiting for a monthly commit and uses trigger metadata to avoid unnecessary work while maintaining reproducible results."
      }
    },
    "keyPoints": [
      "Table update reacts to the governed object, not its file implementation.",
      "The list of updated tables is available via dynamic value reference.",
      "One notification can represent multiple changes and is not a substitute for a multi-table consistency contract."
    ],
    "decisions": [
      "Table update reacts to the governed object, not its file implementation.",
      "The list of updated tables is available via dynamic value reference.",
      "One notification can represent multiple changes and is not a substitute for a multi-table consistency contract."
    ],
    "example": {
      "title": "Passing updated tables to a task",
      "note": "The notebook must validate the JSON and be able to update all relevant tables even if several appear in the same run."
    },
    "pitfalls": [
      "Monitor files from a Delta table and fire before the commit is visible.",
      "Assume that one signal per table provides a consistent snapshot between several related tables."
    ],
    "examDecision": "If the consumer depends on UC table commits, use table update; if it depends on landing files not yet converted to a table, use file arrival.",
    "checkpoint": {
      "question": "What advantage does table updating have over observing internal Delta files?",
      "answer": "It reacts to the governed commit of the table and avoids relying on physical details that may change or appear before a consistent release."
    }
  },
  "m21-l4": {
    "summary": "Concurrency, queuing, timeouts, and notifications determine how the job responds when triggers arrive faster than the job finishes.",
    "explanation": [
      "By default, a Job usually supports an active run. Increasing `max_concurrent_runs` can reduce waiting, but only if concurrent runs write isolated ranges. If not, racing and overload appear. Queuing preserves runs when there is no capacity; Skipping it or exceeding limits can produce skips.",
      "Continuous starts another run upon completion or failure of the previous one and applies its own retries/backoffs. It is suitable for always-on services, not a batch waiting for data. Notifications are configured for failure, duration, or delay and must include owner and context without secrets."
    ],
    "deepDive": {
      "mentalModel": "Concurrency describes how many runs of the same Job can be active; queueing decides whether a run waits when there is no capacity; timeouts limit how long a task or run can remain; Notifications communicate relevant statuses. These controls form a policy of pressure, not simple options. The default safe configuration is usually concurrent execution to prevent two runs from writing the same period. Increasing it is only correct if windows, staging, checkpoints and effects are isolated. When triggers arrive faster than processing, queuing everything conserves work but increases freshness and can create impossible debt; Skipping runs is acceptable only if the next processes cumulatively from a checkpoint. Timeouts should exceed normal p99 and activate idempotent cancellation, not kill healthy charges during spikes. Alerts include late start, duration, failure, and SLA loss, not just end status.",
      "mechanics": [
        "The scheduler compares active runs with `max_concurrent_runs`. If queuing is enabled and the platform supports it, a new run waits; In other behaviors it can be omitted when concurrency is exceeded. Tasks have their own retries and timeouts, and the Job can impose global duration. A cancellation sends a signal to the compute, but an already confirmed external call is not rolled back. Notifications by email or system destinations are configured for failures, duration and other events, and system tables allow measuring wait, execution and historical frequency.",
        "Increasing concurrency to reduce queue can worsen contention duration and duplicate tables. An event trigger with `availableNow` usually converges with a single run: the next one collects everything that is not confirmed. Jobs partitioned by date can support multiple runs if each date writes independent staging and a post serializes. Alerting for each retry produces noise; It is alerted when the budget is exhausted or the SLO is exceeded. Timeouts are tested in backfill and peak, and the runbook distinguishes between canceling, letting finish or expanding capacity."
      ],
      "concepts": [
        {
          "term": "Max concurrent runs",
          "definition": "Configured limit of simultaneous executions of the same Job that the scheduler supports before applying wait or skip.",
          "whyItMatters": "It protects targets and dependencies, and should only grow when there is demonstrable isolation between runs."
        },
        {
          "term": "Queuing",
          "definition": "Policy that keeps a run pending until capacity is available instead of immediately discarding it due to concurrency limits.",
          "whyItMatters": "It preserves work, but transforms saturation into accumulated latency that must be measured against freshness."
        },
        {
          "term": "Timeout",
          "definition": "Time limit after which a task or execution is canceled and adopts a terminal failure state.",
          "whyItMatters": "It contains blocks and cost, but requires idempotence because canceling does not undo already confirmed external effects."
        }
      ],
      "workedScenario": {
        "situation": "A file trigger creates runs every three minutes, each load takes eight and they all write the same silver table; The queue grows and operations proposes concurrency five.",
        "reasoning": [
          "Maintain a single execution because the writes and checkpoint are not isolated, using an incremental source that accumulates pending files.",
          "Configure debounce or frequency and measure that each `availableNow` run empties backlog faster than the average sustained arrival.",
          "Alert for data age and wait, adjusting capacity or partitioning before allowing concurrency that would produce publishing races."
        ],
        "outcome": "The policy absorbs bursts through incremental progress and makes the debt of freshness visible, without multiplying runs that would compete for the same status."
      }
    },
    "keyPoints": [
      "More concurrency is only safe with isolable inputs and effects.",
      "Queuing manages scheduler pressure; does not correct a Job slower than arrival indefinitely.",
      "Timeout and alerts delimit hanging faults and protect the SLO."
    ],
    "decisions": [
      "More concurrency is only safe with isolable inputs and effects.",
      "Queuing manages scheduler pressure; does not correct a Job slower than arrival indefinitely.",
      "Timeout and alerts delimit hanging faults and protect the SLO."
    ],
    "example": {
      "title": "Running guardrails",
      "note": "The `.invalid` address is deliberately fictitious; replace it with a managed target from your environment."
    },
    "pitfalls": [
      "Increase concurrency to reduce queue while all runs overwrite the same partition.",
      "Use continuous for an idle source and pay for restarts/compute without improving freshness."
    ],
    "examDecision": "If triggers accumulate, first measure duration and isolation. Use queuing for spikes; increases concurrency only if the writes are independent.",
    "checkpoint": {
      "question": "When is it safe to allow multiple concurrent runs of the same Job?",
      "answer": "When each run processes independent ranges/targets or writes are transactional and idempotent under proven concurrency."
    }
  },
  "m21-l5": {
    "summary": "A backfill reuses the same parameterized Job as production to execute historical intervals, with controlled concurrency and publishing.",
    "explanation": [
      "Lakeflow Jobs can generate multiple runs for a range and interval and pass backfill parameters. The code uses `process_date` or explicit time limits and idempotently writes the corresponding partition. Maintaining a different code path for history causes divergence just when reliability is most needed.",
      "Before launching ninety days, the number of runs, volume, cost, origin capacity and collision with production are calculated. It can reduce concurrency, write to a shadow table, and batch promote. Validation compares counts and totals per day, and rollback knows exactly which partitions it touched."
    ],
    "deepDive": {
      "mentalModel": "A backfill is a historical execution of the same transformation contract, bounded by reproducible parameters and isolated from the current release. It shouldn't require copying a notebook and changing dates manually. The Job accepts `start`, `end`, code version and mode, reads a durable source and writes staging or deterministic partitions. Granularity balances parallelism and overhead; For each per day can last for months, while millions of keys belong to Spark. Backfill coexists with production through non-overlapping ranges or a serial reconciliation step. It should cover inserts, updates and deletes, not just add missing rows. Once validated, a `MERGE`, controlled replaceWhere or cutover publishes the result. The production streaming checkpoint is not rewinded, and external effects remain disabled or idempotent during story.",
      "mechanics": [
        "A task generates closed-open intervals and For Each processes each one with limited concurrency. Each iteration writes to staging tagged with `backfill_id`, range and version, and produces metrics. Added validations check counts, uniqueness, amounts, and coverage. An ordered final task compares with the current table and applies changes by key or replaces entire partitions when semantics allow. The status of each interval allows selective repair without re-executing already approved ones.",
        "Running backfill with current code may produce a different history than the original version; That can be objective or defect and is documented. Too large a range causes spill and timeout; too small multiplies bootstrap and commits. Production can modify the same partition while it is being validated, generating lost updates; a breakpoint is used or subsequent changes are re-propagated. Delete and reinsert does not handle CDF consumers the same as a MERGE, so the downstream impact is tested first."
      ],
      "concepts": [
        {
          "term": "Closed-open interval",
          "definition": "Temporal range that includes its beginning and excludes its end, allowing partitions to be concatenated without gaps or border double counting.",
          "whyItMatters": "It makes deterministic backfills by day or hour and avoids duplicating events exactly at midnight."
        },
        {
          "term": "Backfill id",
          "definition": "Unique identifier of the historical campaign that accompanies staging, metrics, logs, approvals and associated publication actions.",
          "whyItMatters": "It allows you to audit, repair and revert a correction without mixing it with normal runs or previous campaigns."
        },
        {
          "term": "Cut point",
          "definition": "Version or instant up to which history is reconstructed before reconciling new changes that production continues to generate.",
          "whyItMatters": "Avoid races and loss of updates during a long reconstruction that coexists with the active flow."
        }
      ],
      "workedScenario": {
        "situation": "A tax correction forces two years of invoices to be recalculated while the daily pipeline continues to incorporate adjustments for the same clients and recent months.",
        "reasoning": [
          "Set cutoff version and divide months into closed-open intervals, writing isolated staging with backfill id and approved code.",
          "Limit concurrency according to warehouse and validate taxes, keys, deletes and coverage by interval before marking it publishable.",
          "Serialize the cutover, apply or repagate post-cut changes, and preserve the old table for rollback and auditing."
        ],
        "outcome": "History is corrected in a parallel and verifiable manner without rewinding production, and cutover preserves new changes that occurred during the calculation."
      }
    },
    "keyPoints": [
      "Backfill and ordinary execution share artifact and contract.",
      "Temporal parameters must be explicit and use non-overlapping boundaries.",
      "Cost, concurrency and reconciliation are estimated before creating hundreds of runs."
    ],
    "decisions": [
      "Backfill and ordinary execution share artifact and contract.",
      "Temporal parameters must be explicit and use non-overlapping boundaries.",
      "Cost, concurrency and reconciliation are estimated before creating hundreds of runs."
    ],
    "example": {
      "title": "Idempotent transformation by date",
      "note": "The run parameter delimits the range, while `MERGE` allows retrying on the same day without duplicate keys."
    },
    "pitfalls": [
      "Create a special notebook for backfill that no longer shares validations or production logic.",
      "Launch every day at maximum concurrency and downgrade the daily workload or source."
    ],
    "examDecision": "To repair history, use backfill of the same Job with parameters and idempotent writes; do not copy code or perform a global overwrite.",
    "checkpoint": {
      "question": "What prevents retrying a backfill day from duplicating rows?",
      "answer": "A non-overlapping time boundary and an idempotent write, for example `MERGE` for the business key."
    }
  },
  "m22-l1": {
    "summary": "The production project starts from contracts and NFR: sources, keys, latency, quality, security, recovery and consumers before choosing objects from the pipeline.",
    "explanation": [
      "Append orders and CDC clients have different natures: the former fit into streaming tables; the seconds in AUTO CDC. Gold needs consistent metrics with updates from both sources and can be a materialized view. The design identifies owners and bronze/silver/gold borders with governed names.",
      "NFRs become verifiable decisions: freshness p95, error threshold, RTO, retention and budget. A diagram without acceptance criteria does not allow us to know if the pipeline is finished or what to do in the event of a failure."
    ],
    "deepDive": {
      "mentalModel": "A production pipeline starts with contracts and non-functional requirements, not decorators. Owner, format, keys, sequence, frequency, volume, retention, evolution and delete semantics are documented for each source. For each consumer, grain, freshness, completeness, history, permissions and tolerance for changes are defined. The NFR turns these relationships into decisions: RPO/RTO determine checkpoints and bronze; SLA determines trigger and capacity; privacy determines catalog and columns; cost limits refresh and retention. Only then are streaming tables, materialized views, AUTO CDC, expectations and Jobs chosen. The diagram includes commit and recovery boundaries, not just arrows. A risk matrix covers late data, partial snapshots, schema drift, dropped dependency, and backfill. The final project demonstrates why each object exists and what would happen if it were replaced with an alternative.",
      "mechanics": [
        "The design transforms requirements into an executable specification: versioned contracts, canonical schema, keys, sequence, layers, flows and quality policies. Nominal and peak throughput, stateful cardinality and replay window are estimated. Pipeline border is decided by domain and permissions, catalog by environment and governed event log. A Job coordinates updating, validation, and publishing with immutable parameters. Before implementing, fixtures are created that represent inserts, updates, deletes, duplicates, lateness and corruption.",
        "Optimizing only latency can merge stages and lose isolation; maximizing isolation can multiply cost and commits. A materialized view provides correctable state, but its refresh can be more expensive; a streaming table reduces reading if the source is incremental. AUTO CDC eliminates manual logic, but still relies on a reliable sequence. Fail protects invariants, although it may degrade freshness. Each tradeoff is recorded with metrics and review criteria, avoiding irreversible decisions based on intuition or product names."
      ],
      "concepts": [
        {
          "term": "Functional requirement",
          "definition": "Behavior that the product should offer, such as applying deletes, preserving history, or publishing a metric with defined grain.",
          "whyItMatters": "It determines the correct semantics of the model and allows testing whether the data answers expected questions."
        },
        {
          "term": "Non-functional requirement",
          "definition": "Quantified operational property, such as latency, availability, recovery, security, scalability, or cost under specific conditions.",
          "whyItMatters": "Turn architecture into measurable commitments and avoid considering it sufficient for a query to produce rows."
        },
        {
          "term": "Commit border",
          "definition": "Durable and atomic point after which a stage considers its result published and allows dependents to advance.",
          "whyItMatters": "Makes recovery explicit and avoids exposing partial results during failures or retries."
        }
      ],
      "workedScenario": {
        "situation": "A company combines Kafka orders, customer snapshots and batch references; requires five-minute silver, auditable SCD2, one-hour recovery, and PII isolation.",
        "reasoning": [
          "Formalize keys, sequences, completeness of snapshots and consumers, quantifying peak, retention, RPO/RTO and attributes whose history must be preserved.",
          "Assign streaming table to orders, AUTO CDC FROM SNAPSHOT to clients and materialized views to correctable products, with appropriate catalogs and permissions.",
          "Define checkpoints, event log, expectations, backfill and failure tests before estimating capacity and approving the design for implementation."
        ],
        "outcome": "The architecture is mapped from each requirement to a mechanism and a test, offering a self-sufficient basis to justify technical and operational decisions."
      }
    },
    "keyPoints": [
      "Each source declares append, CDC or snapshot semantics.",
      "Each target declares key, consumer, SLO and rebuild strategy.",
      "External dependencies, data classification and PII are identified before deploying."
    ],
    "decisions": [
      "Each source declares append, CDC or snapshot semantics.",
      "Each target declares key, consumer, SLO and rebuild strategy.",
      "External dependencies, data classification and PII are identified before deploying."
    ],
    "example": {
      "title": "Minimum project contract",
      "note": "Add consumers, classification, reconciliations, and concrete evidence queries in the final delivery."
    },
    "pitfalls": [
      "Choose all targets as streaming tables without considering updates and complete results.",
      "Design the gold layer before agreeing on keys and source semantics."
    ],
    "examDecision": "Semantic mapping from source to object: incremental append → streaming table; CDC → AUTO CDC; materialized result with updates → materialized view.",
    "checkpoint": {
      "question": "What data from the customer feed is essential in addition to `customer_id`?",
      "answer": "A key-authoritative sequence and explicit operation/delete semantics to resolve out-of-order changes."
    }
  },
  "m22-l2": {
    "summary": "The implementation combines order append and client AUTO CDC without mixing states or introducing the old APPLY CHANGES name as a new API.",
    "explanation": [
      "Orders are ingested in bronze and validated in silver with streaming reading. Clients arrive as operations with `source_lsn`; AUTO CDC materializes the current state SCD 1 or the history SCD 2. The streaming table target is declared before the flow and the operational columns are excluded.",
      "Gold matches orders with customers based on temporary need. If the current client is needed, SCD 1 is sufficient; if segmentation at order time matters, SCD 2 and a join by interval are used. That decision changes correctness, cost and complexity."
    ],
    "deepDive": {
      "mentalModel": "Combining append and CDC requires maintaining separate semantics up to a common boundary. Append-only orders represent new facts and enter through an incremental flow; clients represent mutable state and arrive as changes that AUTO CDC orders and applies to a streaming table. `AUTO CDC` is the current option recommended by Databricks; `APPLY CHANGES` maintains the same syntax, is still available, and may appear in Professional questions or legacy code. Recognizing nominal equivalence does not authorize mixing states: each flow retains its own progress, keys and sequence. Enrichment can use a materialized view that combines facts and current dimension or a temporal strategy for SCD2. The project avoids an unnecessary stream-stream join if it only requires dimension snapshots and documents which version of the customer is assigned to an order.",
      "mechanics": [
        "The order flow reads a streaming source, validates identity and persists bronze/silver append with managed checkpoint. The client flow creates a target streaming table and uses `create_auto_cdc_flow` or `AUTO CDC INTO` with keys, sequence, deletes and SCD. A downstream materialized view reads both states and refreshes results. The old names `apply_changes` or `APPLY CHANGES INTO` are interpreted as the replaced API, with equivalent signature, but the new code adopts AUTO CDC.",
        "A client append would produce multiple active rows and duplicate joins. A manual `MERGE` within a declarative function increases responsibility for order and state. SCD2 requires deciding whether the order is enriched with the version valid at event time or with the current client; Both answer different questions. Late arrival of a version may correct the materialized result, while an already enriched fact table may need backfill. It is tested with events out of order, delete and simultaneous change."
      ],
      "concepts": [
        {
          "term": "append semantics",
          "definition": "Model in which each accepted record represents an additional fact and does not implicitly replace another row with the same key.",
          "whyItMatters": "It is appropriate for immutable events and avoids introducing unnecessary upsert state."
        },
        {
          "term": "CDC Semantics",
          "definition": "Model in which records encode entity transitions and must be applied by key, sequence, operation, and history policy.",
          "whyItMatters": "Avoid treating updates and deletes as independent events that would duplicate or make the state obsolete."
        },
        {
          "term": "Legacy name",
          "definition": "Older term still visible and supported, such as APPLY CHANGES, whose current recommended replacement is AUTO CDC with equivalent syntax.",
          "whyItMatters": "It allows you to take exams and maintain existing code without teaching an old API as the first option."
        }
      ],
      "workedScenario": {
        "situation": "Requests arrive through Kafka and clients through Debezium with events out of order; Analytics needs to attribute to each order the valid segment when the purchase occurred.",
        "reasoning": [
          "Persist orders as facts append with event time and clients using AUTO CDC SCD2 using a total sequence from the source log.",
          "Build the enrichment by client validity interval, not by the current row, and test deletes and late versions.",
          "Document that APPLY CHANGES is the equivalent previous name and validate nominal migration separately from any key changes or history."
        ],
        "outcome": "The product preserves facts and history with their correct semantics and answers a reproducible temporal question while using current and recognizable certification terminology."
      }
    },
    "keyPoints": [
      "AUTO CDC is the current API; APPLY CHANGES is the previous name.",
      "Append and CDC use different flows/targets and converge in consumption.",
      "The dimensional join is aligned with current SCD 1 or SCD 2 point-in-time as per requirement."
    ],
    "decisions": [
      "AUTO CDC is the current API; APPLY CHANGES is the previous name.",
      "Append and CDC use different flows/targets and converge in consumption.",
      "The dimensional join is aligned with current SCD 1 or SCD 2 point-in-time as per requirement."
    ],
    "example": {
      "title": "Current clients with AUTO CDC",
      "note": "Validates that `source_lsn` is key monotonic and that its type has stable total order."
    },
    "pitfalls": [
      "Append CDC updates and leave multiple statuses in effect per client.",
      "Choose SCD 1 when reporting needs the historical dimension at the time of the order."
    ],
    "examDecision": "Current status: AUTO CDC SCD 1. Point-in-time history: SCD 2. Avoid a manual MERGE if the pipeline offers AUTO CDC for that feed.",
    "checkpoint": {
      "question": "What does AUTO CDC solve compared to a simple feed append?",
      "answer": "Sorts by sequence, deduplicates changes, interprets deletes and materializes SCD 1 or 2 per key."
    }
  },
  "m22-l3": {
    "summary": "Quality is designed as routes: observation for signals, quarantine for repairable rows and failure for invariants that invalidate the target.",
    "explanation": [
      "Orders without ID go to quarantine with file and reason. Unknown currencies can be observed while business decides. A negative amount in a financial table may fail the update. Shared sorting prevents a row from disappearing between inconsistent filters.",
      "The event log feeds a dashboard by update and flow. Acceptance includes cases for each action, a maximum rate, and a reentry procedure. Protecting quarantine with stricter permissions avoids turning observability into PII leak."
    ],
    "deepDive": {
      "mentalModel": "production quality is designed as routes and thresholds, not as a collection of identical constraints. Observation preserves and measures tolerable abnormalities; quarantine isolates repairable rows with provenance; fail protects invariants that would make the entire target invalid. The same rule can evolve between routes after measuring impact, but the change is versioned. The architecture evaluates common rules once and derives consistent flows, preventing valid and quarantine from disagreeing. An added threshold can escalate from drop to failure when the rate suggests systemic problem. The event log provides metrics by expectation and an operational table preserves trends and ownership. For events with PII, sampling and quarantine are masked and governed. Reentry uses the same contract and key, and the final output is not declared correct until valid, discarded, and pending rows are reconciled.",
      "mechanics": [
        "Transformations add failed rule identifiers and source metadata. The main flow applies retention or fail expectations according to invariants; a quarantine flow persists repairable records. Another task queries metrics from the event log and aggregate controls, calculates update rates and compares with the contract. If it exceeds the threshold, a Jobs condition prevents publishing and triggers remediation. Fixes are written to a controlled input and go back through deduplication and expectations.",
        "Drop without quarantine improves the target's appearance at the cost of invisible completeness. Failing for an optional isolated failure increases staleness and can consume availability. Warn in null identity publishes corruption. Thresholds segment critical domains and use correct denominators. An expensive rule can dominate latency; Added controls are placed after the staging commit. The design tests null SQL, schema evolution, high error rates, and how a repair reuses the same contract version."
      ],
      "concepts": [
        {
          "term": "Observation route",
          "definition": "Treatment that preserves rows and publishes metrics from a rule to gauge risk without immediately altering the processed output.",
          "whyItMatters": "It allows introducing new controls and estimating false positives before deciding on a destructive or blocking action."
        },
        {
          "term": "quarantine route",
          "definition": "Treatment that separates repairable records from the canonical target, preserving minimum payload, origin, rules, owner and remediation status.",
          "whyItMatters": "Protects consumers without losing idempotent investigation, correction and re-entry capabilities."
        },
        {
          "term": "Blocking invariant",
          "definition": "Property whose violation prevents interpreting or reconciling the complete set and forces the affected update to be aborted.",
          "whyItMatters": "Justifies failure due to structural impact and avoids using it indiscriminately for any optional anomaly."
        }
      ],
      "workedScenario": {
        "situation": "0.1% of orders bring unknown currency and can be fixed, but a duplicate `order_id` breaks financial reconciliation and should not be published.",
        "reasoning": [
          "Quarantine unknown currency with identity and owner, measuring rate and maintaining a correction path without silently discarding income.",
          "Treat global uniqueness as a blocking staging control and condition publishing through Jobs after evaluating the entire set.",
          "Extract metrics from the event log, reconcile valid and quarantine, and test idempotent reentry before declaring completeness recovered."
        ],
        "outcome": "The system maintains availability against fixable errors, stops structural corruption, and shows where each row remained until publication or authorized resolution."
      }
    },
    "keyPoints": [
      "Rule, action and remedy are tested together.",
      "Quarantine is a product operated with retention and access, not a permanent dump.",
      "Event log provides metrics; External reconciliation validates completeness and accuracy."
    ],
    "decisions": [
      "Rule, action and remedy are tested together.",
      "Quarantine is a product operated with retention and access, not a permanent dump.",
      "Event log provides metrics; External reconciliation validates completeness and accuracy."
    ],
    "example": {
      "title": "Critical contract in silver",
      "note": "The `orders_quarantine` branch materializes rows where `failure_reasons` is not empty."
    },
    "pitfalls": [
      "Apply `expect_or_drop` and assert that quarantine exists even if the row is not preserved.",
      "Fail for a low severity fixable rule and unnecessarily consume the freshness SLO."
    ],
    "examDecision": "If remediation is needed, implement quarantine; if the entire target would be invalid, the flow fails; If it is only measured, observe.",
    "checkpoint": {
      "question": "What evidence shows that a quarantine rule works?",
      "answer": "The invalid row appears with reason and origin, does not reach silver and can be corrected/reinjected without duplication."
    }
  },
  "m22-l4": {
    "summary": "Lakeflow Jobs wraps the pipeline to parameterize the environment, run validations, condition publishing, and handle alerts or backfills.",
    "explanation": [
      "A pipeline task updates declarative datasets. A subsequent task queries event log and reconciliation; an If/else blocks publication if the threshold is exceeded. Cleanup and notification use Run if. The same bundle defines resources for dev, test and prod with different identities and catalogs.",
      "The promotion is not about copying notebooks. The bundle is validated, the same artifact is deployed, a smoke test is executed and the lineage/scheme is compared. Production is activated with initially paused trigger and known rollback."
    ],
    "deepDive": {
      "mentalModel": "Lakeflow pipelines manage the data graph; Lakeflow Jobs manages the operational process around it. A pipeline task executes the update, but a production flow typically requires environment parameters, prechecks, aggregate validation, release decision, notifications, and backfills. Jobs should not duplicate internal pipeline dependencies or call each dataset separately: treat the update as a unit and coordinate external boundaries. A run receives immutable business window and configuration version. After the pipeline, tasks read event log and staging targets, compute checks, and publish or contain a branch. Retries are applied to transient failures; repair reexecutes the necessary subgraph with the original context. Backfills use the same artifact and contract with explicit mode and range, not copies of notebooks.",
      "mechanics": [
        "The DAG begins with parameter validation and source availability. The pipeline task updates declared datasets and produces an update id. A quality task queries results and event log, publishes small task values, and feeds If/else. The approved branch toggles view or promotes staging; the rejected alerts and preserves evidence. Cleanup uses `All done` for temporary resources without deleting checkpoints or quarantine. Dynamic references record run, trigger, and parameters in an operational table.",
        "Retrying the entire pipeline in the face of a deterministic expectation only repeats the failure; Error is classified and contract or data is corrected. Publishing directly within each flow can expose branches even if another fails, depending on the mode; further validation creates a clear product boundary. Jobs and pipeline with hardcoded catalogs diverge between environments, so they share deployed configuration. A publish repair must be idempotent because the data update may already be committed."
      ],
      "concepts": [
        {
          "term": "Pipeline tasks",
          "definition": "Lakeflow Jobs task type that initiates and waits for an update to a pipeline managed as an operating unit.",
          "whyItMatters": "Integrates declarative processing with control flow, parameters, repairs and notifications without recreating the dataset DAG."
        },
        {
          "term": "Precheck",
          "definition": "Previous task that validates parameters, permissions, availability or manifests before consuming compute and modifying pipeline datasets.",
          "whyItMatters": "Fail early under deterministic conditions and avoid costly or partial updates that could never be published."
        },
        {
          "term": "publishing gate",
          "definition": "Decision after processing and validation that makes the result visible to the consumer only when it meets agreed controls.",
          "whyItMatters": "It separates technical success from product correction and provides an idempotent boundary for repair and rollback."
        }
      ],
      "workedScenario": {
        "situation": "A pipeline update finishes, but a subsequent reconciliation detects that a source arrived incomplete; Consumers should not see the result and the history must be repaired.",
        "reasoning": [
          "Run the pipeline towards staging targets or an unpublished version and keep update id, run id and window parameters.",
          "Calculate reconciliation in a separate task and use If/else to block publishing, alerting and maintaining evidence without blindly retrying.",
          "After correcting the source, use repair or backfill with the same context and make an idempotent publish after passing checks."
        ],
        "outcome": "Orchestration distinguishes a technically completed update from a valid product and allows the exact window to be repaired before exposing it to consumers."
      }
    },
    "keyPoints": [
      "Pipelines transforms; Jobs coordinates control flow and operational effects.",
      "The same artifact is parameterized by target and executed with service principal.",
      "Quality gate uses persisted metrics and blocks only downstream publishing."
    ],
    "decisions": [
      "Pipelines transforms; Jobs coordinates control flow and operational effects.",
      "The same artifact is parameterized by target and executed with service principal.",
      "Quality gate uses persisted metrics and blocks only downstream publishing."
    ],
    "example": {
      "title": "Update and Validate DAG",
      "note": "In a real bundle `pipeline_id` references the deployed resource; avoids fixed IDs between environments."
    },
    "pitfalls": [
      "Put notifications and external calls within a declarative function of the pipeline.",
      "Deploy prod with personal identity and hardcoded paths from dev."
    ],
    "examDecision": "Declarative data control belongs to the pipeline; branching, alerts, approvals and promotion belong to the Job and bundle.",
    "checkpoint": {
      "question": "Why separate `validate_update` from the pipeline task?",
      "answer": "It allows you to use metrics such as quality gate, repair/alert with control flow and keep operational effects outside of declarative definitions."
    }
  },
  "m22-l5": {
    "summary": "production readiness is demonstrated with replay, backfill, quality failure, metrics, cost, and an executed runbook, not just a successful update.",
    "explanation": [
      "The team tries a second run with no data, an out-of-order CDC update, a quarantined row, and a recoverable crash. A backfill of a date uses the same pipeline/Job and is reconciled. The event log should explain which flows processed rows and which expectations failed.",
      "The runbook identifies owner, SLO, panels, retry, repair or full refresh decisions and rollback routes. Delivery includes evidence queries and known limits. A happy demo without incident or recovery does not validate production."
    ],
    "deepDive": {
      "mentalModel": "production readiness is demonstrated with evidence of correctness, recovery, capacity, safety and operation. A successful run with happy data only tries the simplest route. The checklist includes deterministic replay, concurrent backfill, compatible and incompatible schema evolution, failing expectation, slow sink, checkpoint restore, cost limits and minimum permissions. SLA is measured at peak volume and RTO with a game day. The event log and system tables feed dashboards, alerts and cost attribution. A runbook describes symptoms, queries, safe decisions, rollback, and owners, and another person must be able to run it without tribal knowledge. The promotion uses versioned artifact, revised configuration and acceptance criteria; The rollback preserves previous tables and checkpoints. Preparation also requires recognizing limits: no course guarantees passing or replaces practice, but the product must cover examineable mechanisms and decisions in self-sufficient depth.",
      "mechanics": [
        "CI validates types, transformation tests, configuration and graph. An integration environment runs fixtures with inserts, updates, deletes, lateness and corruption. Performance tests reproduce peak and look at duration, status, files and cost. A game day interrupts compute and external dependency, measures detection and recovery, and reconciles outputs. Before production, grants, secrets, ownership, notifications, retention and budgets are reviewed. The deployment records commit, bundle, pipeline update and Job run for complete traceability.",
        "A small test can hide skew and state store; a backfill can compete with the current SLA; Personal owner permissions break continuity. Untested alerts do not prove that they reach the person responsible. A full refresh can exceed retention or budget even if the incremental one works. The go/no-go decision requires explicit thresholds and dated exceptions. After publishing, a reinforced window is observed and rollback is preserved. Each incident updates tests and runbook, turning operation into a continuous part of the design."
      ],
      "concepts": [
        {
          "term": "Acceptance criteria",
          "definition": "Measurable condition that a release must satisfy in correctness, performance, recovery, security, and cost before it is promoted.",
          "whyItMatters": "Avoid go-live decisions based solely on a green run or an informal code review."
        },
        {
          "term": "game day",
          "definition": "Controlled experiment that introduces representative failures and measures alerting, diagnosis, recovery, reconciliation, and RTO/RPO compliance.",
          "whyItMatters": "Transform resilience assumptions into evidence and uncover knowledge or permission dependencies before an incident."
        },
        {
          "term": "runbook",
          "definition": "Versioned procedure with symptoms, queries, decisions, safe commands, escalation criteria, rollback and those responsible for recovery.",
          "whyItMatters": "It reduces diagnosis time and allows the operation to not depend exclusively on the original author."
        }
      ],
      "workedScenario": {
        "situation": "The team wants to promote a pipeline that processed a successful sample, but never tested deletes, full refresh, driver crashes, alerts, or service user permissions.",
        "reasoning": [
          "Block promotion until running complete fixtures, identity review, security and capacity testing with a representative volume and skew.",
          "Conduct checkpoint and sink game days, measure RTO/RPO and reconcile results while a different operator follows the runbook.",
          "Register criteria, exceptions and rollback, deploy with versioned artifact and maintain reinforced observation during the first production window."
        ],
        "outcome": "The release to production is supported by repeatable operational and semantic tests, with clear owners and rollback, instead of extrapolating confidence from a small demo."
      }
    },
    "keyPoints": [
      "Idempotency is tested by executing the same input twice.",
      "Recovery is tested with failure and realistic checkpoint/state.",
      "Acceptance includes quality, observability, security and cost in addition to the functional result."
    ],
    "decisions": [
      "Idempotency is tested by executing the same input twice.",
      "Recovery is tested with failure and realistic checkpoint/state.",
      "Acceptance includes quality, observability, security and cost in addition to the functional result."
    ],
    "example": {
      "title": "Operational acceptance checklist",
      "note": "Each element links to a reproducible query, run, or capture, not a manual flag without evidence."
    },
    "pitfalls": [
      "Accept the project because the tables exist even though there is no retry or recovery evidence.",
      "Perform full refresh by default without estimating cost, availability or effect on consumers."
    ],
    "examDecision": "Before declaring production-ready, require evidence of idempotency, observability, repairability, and NFR; A green pipeline once is not enough.",
    "checkpoint": {
      "question": "What test distinguishes idempotence from simply successful execution?",
      "answer": "Repeat exactly the same input and show that final state and counts do not change or duplicate effects."
    }
  },
  "m23-l1": {
    "summary": "Learn to distinguish real skew from a simply expensive stage using the distribution of times, bytes and registers per task.",
    "explanation": [
      "In Spark, a stage ends when its slowest task finishes. That's why a reasonable average can hide an extreme queue: if the median lasts 18 seconds and a task takes 11 minutes, adding workers does not eliminate the hot key that concentrates data. Useful evidence is in the Stages tab of Spark UI: maximum vs median duration, input logs, shuffle read, and size of each task.",
      "Before applying salting, confirm the cause. A join with a dominant null key, a disproportionate client, or a temporary partition that is too large produces different remedies. AQE can split skewed partitions into compatible joins; If distribution is part of the business, it is also advisable to isolate hot keys or redesign the aggregation and measure the effect with the same data set."
    ],
    "deepDive": {
      "mentalModel": "Imagine a Spark stage as a team race with the official time determined by the last rider. Each partition produces one task and all must finish before moving forward; That is why the average hides the decisive data. The skew does not simply mean that the set is large, but that the distribution of work between tasks is very unequal. A frequent key, a dominant null value, or a disproportionate time range concentrates records and bytes into a few partitions. The correct diagnosis links three levels: business data distribution, physical partitioning after the exchange, and queuing durations observed in Spark UI. Scaling compute improves overall capacity, but does not redistribute a hot key on its own.",
      "mechanics": [
        "A join or shuffle aggregation applies a partitioning function to the key and sends records with the same result to the same output partition. When one key dominates, one task receives much more shuffle read, buffer, and CPU than the others. Spark UI allows you to compare maximum, median, and percentiles of duration, records, and bytes per task. AQE can detect skewed partitions after the exchange and split them, replicating when necessary the compatible side of the join; The final adaptive plan shows whether that rule was ever applied.",
        "The correction depends on the cause. Splitting nulls, isolating a few hot keys, partially appending before the join, or applying selective salting changes the distribution, but adds branches, auxiliary keys, and recomposition cost. Increasing partitions helps if many are reasonably large, not if one indivisible key dominates. A broadcast on the small side can avoid shuffling the large table, although it introduces replicated memory. The decision must be measured with representative data and compare maximum time versus median, shuffle, spill and correction of the result."
      ],
      "concepts": [
        {
          "term": "Data skew",
          "definition": "Distribution in which a few keys or ranges concentrate a disproportionate fraction of records and work.",
          "whyItMatters": "Converts a few tasks to the critical path even if the cluster has idle capacity."
        },
        {
          "term": "Exchange",
          "definition": "Physical plan boundary that redistributes data between executors, typically for joins, aggregations, or windows.",
          "whyItMatters": "It is the point where the logical distribution of keys materializes as partitions and can reveal skew."
        },
        {
          "term": "Straggler",
          "definition": "Much slower task than its peers within the same stage.",
          "whyItMatters": "The stage doesn't end until the straggler finishes; That is why the maximum weighs more than the average."
        }
      ],
      "workedScenario": {
        "situation": "A daily shutdown processes 2.4 TB. Nine hundred and ninety tasks last about 40 seconds and ten exceed twenty minutes; 38% of orders have null customer_id through a guest channel.",
        "reasoning": [
          "Compare by task duration, logs, and shuffle read to show that the queue matches abnormally large partitions, not uniformly slow.",
          "Profile customer_id and separate the guest flow before the join, preserving its semantics with a branch that does not need the customers dimension.",
          "Run both branches, recompose with unionByName and check counts, amounts, maximums per task and adaptive plan against the baseline."
        ],
        "outcome": "The stage stops depending on ten hot partitions and drops to six minutes without increasing workers; The runbook documents the null branch and an observable skew threshold."
      }
    },
    "keyPoints": [
      "Compare percentiles and maximums per task, not just the average duration of the stage.",
      "Relates the slow task to its shuffle bytes and number of registers.",
      "Correct data distribution before permanently increasing capacity."
    ],
    "decisions": [
      "Compare percentiles and maximums per task, not just the average duration of the stage.",
      "Relates the slow task to its shuffle bytes and number of registers.",
      "Correct data distribution before permanently increasing capacity."
    ],
    "example": {
      "title": "Measure the distribution of a key before the join",
      "note": "The frequency table does not replace Spark UI, but it allows you to connect an extreme task to a specific business key."
    },
    "pitfalls": [
      "Confuse many small tasks with skew: in that case the problem may be overpartitioning and scheduling overhead.",
      "Apply salting to all keys and make the join more expensive even if only a minimal fraction is biased."
    ],
    "examDecision": "If a few tasks consume much more shuffle and time than the median, investigate skew and let AQE act before resizing the cluster.",
    "checkpoint": {
      "question": "One stage has 4,000 tasks; 3,995 last less than 25 seconds and five exceed 12 minutes with ten times the shuffle read. What is the first hypothesis?",
      "answer": "Skew data into a few partitions; you have to locate the hot keys and check if AQE splits them."
    }
  },
  "m23-l2": {
    "summary": "Interpret memory spill and disk spill as symptoms of pressure during sort, aggregate or join, not as an automatic order to buy more memory.",
    "explanation": [
      "Spark spills data when an operation cannot keep its intermediate structures in memory. Spilling to disk adds serialization and I/O; a small volume may be normal, but massive spill along with garbage collection, long tasks or executor lost indicates that the plan and shape of the data does not fit efficiently. Check the specific stage, operator and layout before changing the machine.",
      "The levers have different costs. Reducing row width by projecting only necessary columns, filtering before shuffle or replacing a UDF with native functions reduces work. Repartitioning can distribute the load better, while workers with more memory help when each partition is legitimately large. Increasing `spark.sql.shuffle.partitions` without measuring can create thousands of tiny tasks."
    ],
    "deepDive": {
      "mentalModel": "Think of Spark's execution memory as a shared workbench, not a permanent store. A sort, hash aggregate or join builds temporary structures per task; If the active portion does not fit, Spark preserves correctness by writing part to disk and reading it later. That spill is a survival mechanism, not necessarily a failure. It becomes problematic when it dominates time, coincides with garbage collection, retries or lost executors, or concentrates on specific partitions. The useful question is not how much memory the entire cluster has, but which operator, with what row width and distribution, demands how much concurrent memory in each task.",
      "mechanics": [
        "During an aggregation or sorting, Spark reserves execution memory for buffers, hash maps, and sort structures. When the task exceeds the memory granted, it serializes intermediate blocks; memory spill reflects conceptually evicted bytes and disk spill reflects actually written bytes, so they should not be compared as identical measurements. Spark UI places the spill in stages and tasks, while the physical plan identifies the operator that generates it. Filtering, projecting columns, and pre-aggregating before an exchange directly reduce the intermediate state.",
        "More memory per executor may allow larger structures, but often reduces the number of executors per node and changes parallelism. More partitions decrease the average volume per task, although they increase scheduling and small files; fewer partitions do the opposite. A severe skew is not resolved with a smaller partition mean. The optimization should conserve memory headroom, avoid coalescing to a single partition, and be validated at peak volume, looking at spills per task, GC, duration, and stability, not just a small, unpressurized run."
      ],
      "concepts": [
        {
          "term": "Execution memory",
          "definition": "Memory temporarily used by shuffle, join, sort, and aggregate operators while a task is active.",
          "whyItMatters": "Its pressure occurs per task and operator; Adding cluster RAM does not describe whether a partition will fit."
        },
        {
          "term": "Memory spill",
          "definition": "Estimation of intermediate data evicted from in-memory structures during execution.",
          "whyItMatters": "It indicates pressure, but does not necessarily equate to physical bytes written to disk."
        },
        {
          "term": "Disk spill",
          "definition": "Intermediate data serialized to local storage so the operation can continue.",
          "whyItMatters": "Adds I/O and serialization; a sustained high value usually explains queues or instability."
        }
      ],
      "workedScenario": {
        "situation": "A 600 GB MERGE fails some nights with executor lost. The deduplication stage drags a 40 KB JSON column that never participates in keying or updating.",
        "reasoning": [
          "Locate the sort aggregate with spill and check that large tasks carry the full payload before deduplicating.",
          "Project key, sequence and updateable columns, deduplicate that narrow frame and recover the payload only if the final contract needs it.",
          "Repeat with peak percentile, comparing spill, GC, failed tasks, count and checksum of business columns before resizing compute."
        ],
        "outcome": "Disk spill drops by 92% and executor losses disappear; the cluster size is maintained and a test is added that prevents reintroducing wide columns before the shuffle."
      }
    },
    "keyPoints": [
      "Place the spill on a specific stage and operator.",
      "Reduces data before shuffle using filters and column projection.",
      "Difference pressure per workload global lack of memory partition."
    ],
    "decisions": [
      "Place the spill on a specific stage and operator.",
      "Reduces data before shuffle using filters and column projection.",
      "Difference pressure per workload global lack of memory partition."
    ],
    "example": {
      "title": "Reduce width before adding",
      "note": "Early projection avoids carrying payloads that do not participate in aggregation; commits the change to the plan and shuffle bytes."
    },
    "pitfalls": [
      "Increase the size of workers without removing large columns that cross the shuffle.",
      "Use `coalesce(1)` to control files and concentrate all writing on one task."
    ],
    "examDecision": "In case of spills, first reduce the volume per partition and verify the plan; It scales vertically only when the required partition continues to exceed memory.",
    "checkpoint": {
      "question": "Why doesn't a high spill alone prove that the entire cluster is out of memory?",
      "answer": "Because it can originate from a single skewed partition or an operator moving unnecessary columns; you have to locate stage and task."
    }
  },
  "m23-l3": {
    "summary": "Understand what Adaptive Query Execution can reoptimize at runtime and what decisions remain dependent on the engineer's design.",
    "explanation": [
      "AQE uses statistics available after exchanges to change a sort-merge strategy to a broadcast hash, merge too-small post-shuffle partitions, split skewed partitions, and propagate empty relations. In Databricks it is enabled by default for batch queries compatible with exchanges or subqueries. The final adaptive plan may differ from the initial plan shown before running.",
      "AQE does not dynamically reorder all joins or fix a broken data model. A relationship that appears small in the catalog may exceed the actual limit, and certain join types do not support broadcast on one side. Use `explain('formatted')`, the final Spark UI plan, and execution metrics to demonstrate which rule was applied; Avoid copying old configurations that override optimized defaults."
    ],
    "deepDive": {
      "mentalModel": "Catalyst prepares a route with estimates; AQE acts as a navigator that recalculates when it already knows the actual traffic after certain junctions. These junctions are query stages separated by exchanges or subqueries. When a stage materializes, Spark obtains more reliable sizes and distributions than previous statistics and can change some physics decisions without altering the logical query. AQE is not an omniscient optimizer: it does not correct semantics, it does not redesign the model or freely reorder any join chain. Its value is in adapting post-shuffle partitions, dealing with skew, propagating empty relations and, when appropriate, replacing a sort-merge with broadcast with runtime evidence.",
      "mechanics": [
        "AQE is enabled by default for supported batch queries that contain exchanges or subqueries. After completing a query stage, it analyzes runtime statistics and can combine small partitions to approximate a target size, split skewed partitions, and change join strategies. The initial plan appears as AdaptiveSparkPlan; After materializing an action, Spark UI allows you to see the final plan and actual statistics. An adaptive plan can retain the same form if no alternative overcomes the original decision, which does not mean that AQE was disabled.",
        "Late adaptation has cost limits: if Spark discovers after a shuffle that one side is broadcastable, part of the exchange may have already occurred, while a well-founded broadcast from the start could prevent it. Aggressive configurations can create memory pressure or too many partitions; Incorrect hints restrict the optimizer. It is advisable to maintain defaults, statistics and early data reduction, use hints only with operational invariants and compare the final plan, exchange bytes, time and stability over various input sizes."
      ],
      "concepts": [
        {
          "term": "Query stage",
          "definition": "Fragment of the adaptive plan delimited by exchanges whose output can materialize runtime statistics.",
          "whyItMatters": "AQE makes new decisions with precise information at the end of each materializable stage."
        },
        {
          "term": "Post-shuffle coalescing",
          "definition": "Dynamic combination of small partitions produced by a shuffle.",
          "whyItMatters": "Reduces overhead of tiny tasks without imposing a static number suitable for all volumes."
        },
        {
          "term": "Final adaptive plan",
          "definition": "Physical plan effective after applying or discarding AQE rules during execution.",
          "whyItMatters": "It is the evidence to know what strategy was used; The initial plan is not enough."
        }
      ],
      "workedScenario": {
        "situation": "A monthly query joins 8 TB of facts with a filtered table whose size varies between 30 MB and 2 GB depending on region; catalog statistics are behind.",
        "reasoning": [
          "Maintain AQE and materialize the query to observe statistics for each region and the final plan, without assuming that the same join always works.",
          "Check if small regions change to broadcast and if large ones retain sort-merge, also comparing already paid exchanges and maximum memory.",
          "Update statistics and decide whether a range-separated design is appropriate only if variability causes regressions that AQE cannot prevent in time."
        ],
        "outcome": "The consultation safely adopts different strategies by region; The team eliminates a global hint that failed in the big months and monitors the final plan."
      }
    },
    "keyPoints": [
      "AQE decides with post-shuffle statistics, more precise than many previous estimates.",
      "You can coalesce partitions and skew without altering the logical result.",
      "It does not replace the logical order of joins or good early data reduction."
    ],
    "decisions": [
      "AQE decides with post-shuffle statistics, more precise than many previous estimates.",
      "You can coalesce partitions and skew without altering the logical result.",
      "It does not replace the logical order of joins or good early data reduction."
    ],
    "example": {
      "title": "Inspect configuration and adaptive plan",
      "note": "The action materializes the consultation; Review the final plan later and do not deduce the strategy only from the initial plan."
    },
    "pitfalls": [
      "Assume that AQE automatically reorders a poorly designed join chain.",
      "Disable AQE to reproduce a legacy configuration without comparing results and metrics."
    ],
    "examDecision": "Trust AQE for compatible runtime settings; Keep hints only when you know the relationship and can demonstrate that anticipating the strategy avoids work.",
    "checkpoint": {
      "question": "What advantage does a statically planned broadcast have over one chosen late by AQE?",
      "answer": "You can avoid the shuffle from both sides from the beginning; AQE may only discover the true size after that exchange already occurs."
    }
  },
  "m23-l4": {
    "summary": "Select broadcast, sort-merge or another strategy depending on size, join type, statistics and risk for the driver and executors.",
    "explanation": [
      "A broadcast hash join replicates the small relationship and avoids sharing the large one over the key. It's great for a really small dimension, but dangerous if the statistics are stale or the spread side grows: the transfer and hash table consume memory on each executor. Hints express a preference to the optimizer, they do not correct incompatible join semantics.",
      "For large joins, sort-merge distributes both sides and pays for shuffle and sorting. Reduce rows and columns first, keep statistics, and watch for hot keys. In SQL and DataFrames, the criteria is not 'broadcast is always faster', but rather total cost, join type compatibility, and stable evidence in representative runs."
    ],
    "deepDive": {
      "mentalModel": "A join strategy decides where rows are located, how much data travels, and what memory is replicated. Broadcast carries a small relationship to each executor and avoids redistributing the large one; sort-merge redistributes both sides by key and sorts them; shuffle hash also partitions and builds maps per partition. There is no universally fast strategy. The choice depends on the size after filters and projections, the type of join, the key distribution, the quality of statistics and the memory limits. The correct mental model compares total cost and risk: network, ordering, repeated memory, possible skew and stability when the supposedly small side grows.",
      "mechanics": [
        "In broadcast hash join, the driver coordinates the broadcast relationship and each executor builds a local hash table; the large side can be traversed without shuffle by the key. Compatibility depends on semantics: in certain outer joins only the side that must not preserve all its rows can be broadcast. Catalyst uses statistics and thresholds, AQE can change strategy late and a hint expresses preference. Physical plan confirms BuildLeft or BuildRight, effective exchanges and filters; counting rows alone ignores width and serialization.",
        "Sort-merge join tolerates two large sides but pays shuffle, sort and spill potential. Filtering and screening beforehand reduces all those costs; Physically partitioning the tables does not guarantee avoiding the exchange if distribution and requirements do not match. Forcing broadcast can cause timeout or pressure on each executor, especially with concurrency. The safe practice sets an operating limit of the distributed artifact, maintains statistics, tests the maximum volume, and maintains a distributed alternative. A hint is justified by a measurable invariant, not by a specific capture."
      ],
      "concepts": [
        {
          "term": "Build side",
          "definition": "Side of the join used to build the hash structure, local or broadcast.",
          "whyItMatters": "Determines memory, support for outer joins, and which set should remain bounded."
        },
        {
          "term": "Broadcast exchange",
          "definition": "Operation that collects and distributes a relationship to the executors that execute the join.",
          "whyItMatters": "It avoids a large shuffle, but replicates bytes and may fail if the relationship grows."
        },
        {
          "term": "Sort-merge join",
          "definition": "Strategy that distributes both sides by key, orders and merges them sequentially.",
          "whyItMatters": "Scale to large relationships in exchange for network, ordering, temporary memory and possible spill."
        }
      ],
      "workedScenario": {
        "situation": "A pipeline links 4 TB of clicks with products. The entire table occupies 12 GB, but only 180 MB corresponds to active products and three columns are needed.",
        "reasoning": [
          "Apply the lifetime filter and projection before the join, measure estimated and actual bytes of the result, and update statistics if they are outdated.",
          "Check that the left join preserves clicks and that products can be the build side; rehearse broadcast with representative concurrency.",
          "Compare plan, shuffle, maximum memory and duration with sort-merge, and set alert if the filtered dimension exceeds the agreed limit."
        ],
        "outcome": "Broadcast reduces the shuffle in terabytes and the SLA from 24 to 7 minutes, with a guardrail that reverts to a distributed strategy when the dimension is no longer bounded."
      }
    },
    "keyPoints": [
      "Disseminate only bounded relations whose size you know in production.",
      "A hint does not change which side can be broadcast in each type of join.",
      "Update statistics and compare the physical plan, not just the source code."
    ],
    "decisions": [
      "Disseminate only bounded relations whose size you know in production.",
      "A hint does not change which side can be broadcast in each type of join.",
      "Update statistics and compare the physical plan, not just the source code."
    ],
    "example": {
      "title": "Explicit Broadcast of a Bounded Dimension",
      "note": "Documents the expected maximum size of `active_products`; A small snapshot today does not guarantee that it will continue to be disseminated."
    },
    "pitfalls": [
      "Force broadcast from a sample `count()` that does not represent the daily maximum.",
      "Spread a wide table when it was enough to project two columns of the dimension."
    ],
    "examDecision": "Choose broadcast for a small, bounded relationship, compatible with join; if both are large, reduce data and leave a distributed strategy.",
    "checkpoint": {
      "question": "A dimension has 20 million rows but only two columns are needed and active records are 1%. What would you do before the join?",
      "answer": "Filter assets and project the two columns; then measure the resulting size and only then decide if broadcast is safe."
    }
  },
  "m23-l5": {
    "summary": "Avoid barriers between Python and the engine by using native expressions and reserving UDFs for logic that the platform cannot express.",
    "explanation": [
      "Native SQL and PySpark functions remain visible to Catalyst and can benefit from Photon, code generation, pushdown, and expression simplification. A Python scalar UDF serializes data between the JVM and Python, hides some logic from the optimizer, and can cause Photon fallback. Before creating it, look for built-in functions for arrays, maps, strings, dates, and complex types.",
      "When the logic does not exist, a Pandas UDF or Arrow-based APIs can process batches and reduce cost per row, but still require measurement, explicit types, and null testing. Correct optimization includes maintainability: a readable native expression is usually easier to govern and port than an opaque UDF."
    ],
    "deepDive": {
      "mentalModel": "Catalyst can only optimize what it understands. A native expression is part of the logical tree: the engine knows types, nullability, and operators, can fold constants, push filters, and run with Photon when supported. A Python UDF looks like a black box on the other side of a process boundary; Spark must serialize columns, transfer batches or rows, and accept that it cannot reason about the internal logic. This does not make UDFs illegitimate, but it changes the burden of proof. First, SQL functions, higher-order functions, and complex type operations are searched; Only functional necessity justifies losing visibility and adding an explicit contract.",
      "mechanics": [
        "Native functions remain in the Spark plan and can be combined with code generation, pushdown, and vectorized execution. A Python scalar UDF moves data between the Spark runtime and Python workers, introduces serialization, and typically prevents Photon from executing that operator. Pandas UDFs use Arrow and batch processing to amortize the frontier, but retain conversion costs, memory, and null semantics. Spark UI or Query Profile displays the operator and percentage outside of Photon, while extreme data tests validate the result.",
        "Rewriting a UDF can make the expression longer; optimization should not sacrifice understanding or contract. Encapsulating a native composition in a Python function that returns Column preserves visibility without duplicating logic. If an external library is essential, input and output types, null treatment, batch size, dependencies and deterministic cases are fixed. Cost is compared per representative volume and fallback is accepted when the functional value exceeds the penalty, documenting why there is no native equivalent."
      ],
      "concepts": [
        {
          "term": "Catalyst Expression",
          "definition": "Typed node of the logical plan that represents an operation known to the optimizer.",
          "whyItMatters": "Allows simplification, pushdown and choice of native or Photon operators."
        },
        {
          "term": "Python Border",
          "definition": "Transfer and serialization between the process running Spark and a Python worker.",
          "whyItMatters": "Adds cost per batch or row and hides internal semantics from the optimizer."
        },
        {
          "term": "Higher order function",
          "definition": "Native function that transforms or filters elements of arrays and maps using lambda SQL expressions.",
          "whyItMatters": "Resolve complex logic while keeping it visible and optimizeable, often avoiding UDFs."
        }
      ],
      "workedScenario": {
        "situation": "A Python UDF classifies 9 billion daily events by inspecting an array of attributes; the profile shows 63% of the time away from Photon.",
        "reasoning": [
          "Specify semantics, including null, empty arrays, and unknown values, and map them to native exists, transform, and aggregate.",
          "Implement the expression as a function that returns Column and run equivalence tests on borderline cases and a stratified sample.",
          "Compare plan, Photon percentage, CPU and duration at peak volume; keep the UDF behind a regression test until parity is validated."
        ],
        "outcome": "The logic is completely visible to the engine, the query uses Photon end-to-end, and the time drops by 46% without changing the ranking."
      }
    },
    "keyPoints": [
      "Prefers native functions because the optimizer retains visibility of the expression.",
      "Check in Query Profile or Spark UI if a UDF causes Photon fallback.",
      "If you need Python, batch vectorize and define type and null contracts."
    ],
    "decisions": [
      "Prefers native functions because the optimizer retains visibility of the expression.",
      "Check in Query Profile or Spark UI if a UDF causes Photon fallback.",
      "If you need Python, batch vectorize and define type and null contracts."
    ],
    "example": {
      "title": "Native normalization without UDF",
      "note": "The expression becomes available for the plan; Explicitly tests null emails, without at sign and with spaces."
    },
    "pitfalls": [
      "Create a UDF for operations already covered by `when`, `transform`, `regexp_extract` or date functions.",
      "Replace a scalar UDF with pandas UDF without measuring serialization, batch size and memory pressure."
    ],
    "examDecision": "If an equivalent native expression exists, use it; choose a UDF only for functional necessity and validate the cost and compatibility of the motor.",
    "checkpoint": {
      "question": "What signal confirms that a UDF harms Photon?",
      "answer": "The Query Profile shows operators dropping to the Spark runtime around the UDF and increasing the time away from Photon."
    }
  },
  "m24-l1": {
    "summary": "Understand where Photon accelerates the plan, how it detects a fallback, and why measuring price/performance matters more than comparing DBUs per hour.",
    "explanation": [
      "Photon is Databricks' native vector engine. Catalyst continues to generate the plan, while Photon runs compatible operators in columnar batches and uses a C++ runtime that reduces JVM costs. It is enabled in serverless and SQL warehouses, and by default in modern classic compute; accelerates scans, joins, aggregations, shuffles and compatible writes without requiring rewriting SQL or DataFrames.",
      "Not every consultation improves equally. UDFs, RDDs, Dataset APIs, and unsupported operations can execute parts in Spark, and subsecond queries are typically dominated by scheduling. In Spark UI the Photon operators are distinguished in the DAG; In Query Profile you can see the percentage of time. It evaluates duration, task time, data read and total cost, not just that the box is activated."
    ],
    "deepDive": {
      "mentalModel": "Photon is not another cluster or a separate foundation: it is a native vectorized engine that runs compatible operators within the Spark and SQL blueprint. Process values ​​in batches with optimized code and especially improve wide scans, joins, aggregations and writes; a plan can alternate Photon operators and Spark runtime without changing results. That's why activating Photon does not guarantee uniform acceleration. The correct metric is price/performance of the entire workload and percentage of time actually executed by Photon. An unsupported UDF, RDD API, or operation creates fallback; queries of less than a few seconds may be dominated by fixed latency and show no material benefit.",
      "mechanics": [
        "Catalyst continues to produce the plan; Photon implements operators compatible with native vectorized execution and its own Parquet writer. In Spark UI, Photon operators are distinguished in the SQL/DataFrame display; In Query Profile for warehouses and serverless, Execution Details reports the percentage of task time in Photon. An unsupported operator changes transparently to the Spark runtime for that part, so the fix is ​​preserved. SQL and DataFrame APIs are candidates, while UDFs, RDDs, Datasets and stateful streaming are out of current support.",
        "The cost must be normalized by finished work: euros per correct pipeline, query or terabyte, not per DBU/isolated hour. Photon can consume a different rate and even reduce time, active infrastructure and queues; It can also contribute little if remote I/O, waiting or coordination dominate. The benchmark needs representative data and concurrency, controlled caches, multiple runs and the same result. First, avoidable fallback is eliminated and measured; Then it is decided by SLA and total cost, avoiding promises based on a two-second microbenchmark."
      ],
      "concepts": [
        {
          "term": "Vectorized execution",
          "definition": "Process batches of values using efficient native operations instead of interpreting row by row.",
          "whyItMatters": "Increase CPU performance and make better use of memory for compatible analytical operators."
        },
        {
          "term": "Fallback",
          "definition": "Transparent execution of an operator with the Spark runtime when Photon does not support it.",
          "whyItMatters": "The result is still correct, but an expensive section may limit the overall acceleration."
        },
        {
          "term": "Price/performance",
          "definition": "Monetary or usage cost for a complete unit of useful and correct work.",
          "whyItMatters": "It allows you to compare engines even if they differ in hourly rate and duration."
        }
      ],
      "workedScenario": {
        "situation": "A 70-minute ETL uses Photon, but only spends 18% of the time on Photon operators because a normalization UDF pandas dominates the core stage.",
        "reasoning": [
          "Use Query Profile to separate scan, join, UDF, write and wait, identifying the operator that forces the fallback and its actual weight.",
          "Rewrite normalization with native functions and validate equivalence of nulls, Unicode and historical results before comparing times.",
          "Run multiple times with peak volume and calculate cost per published partition, Photon percentage, duration and error rate."
        ],
        "outcome": "Photon time reaches 86%, ETL ends in 31 minutes and cost per publication drops 28% even if the hourly rate does not change."
      }
    },
    "keyPoints": [
      "Photon changes the physical execution, not the semantics or logical plan of Catalyst.",
      "Locate fallbacks with Spark UI or Query Profile.",
      "Compare cost per job completed, not isolated DBU rate."
    ],
    "decisions": [
      "Photon changes the physical execution, not the semantics or logical plan of Catalyst.",
      "Locate fallbacks with Spark UI or Query Profile.",
      "Compare cost per job completed, not isolated DBU rate."
    ],
    "example": {
      "title": "Query compatible with vectorized execution",
      "note": "Check the Query Profile to confirm pruning, more expensive operators and time in Photon; don't infer the result just from the syntax."
    },
    "pitfalls": [
      "Attribute all improvements to Photon without controlling cache, volume and concurrency between tests.",
      "Maintain an avoidable UDF and conclude that Photon does not add value to the workload."
    ],
    "examDecision": "Choose Photon for SQL/DataFrames support and decide with price/performance metrics; investigate fallback before scaling compute.",
    "checkpoint": {
      "question": "What happens when Photon encounters an unsupported operation?",
      "answer": "That part of the plan falls transparently into the Spark runtime; The result is still correct, but it may lose acceleration."
    }
  },
  "m24-l2": {
    "summary": "Design data skipping based on real predicates and statistics, avoiding layouts that only reflect how the data arrived.",
    "explanation": [
      "Delta logs statistics per file so that the engine discards files whose range cannot satisfy the filter. Skipping works when the queried columns have useful statistics and the values ​​are organized so that different files cover discriminant ranges. A very selective filter does not help if all files contain almost the entire range of the column.",
      "On managed Unity Catalog tables, predictive optimization can automatically collect statistics. If you change the statistics columns, `ANALYZE TABLE ... COMPUTE DELTA STATISTICS` recalculates the log information; optimizer statistics are updated with `ANALYZE TABLE ... COMPUTE STATISTICS`. Check Query Profile for bytes read and pruned percentage, not just the hot time of a second execution."
    ],
    "deepDive": {
      "mentalModel": "Data skipping works like a distributed thick index: Delta maintains per-file statistics, such as minimums and maximums of eligible columns, and the engine discards impossible files before reading their rows. It does not search for a specific row or replace a filter; reduces the set of candidate files when the predicate is selective and the related values ​​are physically grouped. If each file contains the entire range of dates or clients, their ranges overlap and statistics don't help. The design starts with the actual history of filters and joins, not the order of arrival. Clustering, compaction, and file size shape the usefulness of those statistics without creating a rigid directory hierarchy.",
      "mechanics": [
        "When writing a Delta table, each AddFile in the log can record column statistics. During planning, a compatible predicate is compared against those ranges and avoids opening files that cannot contain matches; then the engine applies the normal filter to the read rows. Effectiveness is seen in files and bytes pruned versus read in Query Profile. Predicates wrapped in functions, unnecessary conversions, or columns without statistics can limit pruning. Clustering increases the physical correlation between nearby values ​​and files, making the ranges narrower.",
        "Choosing too many layout columns dilutes the grouping and adds maintenance. A high cardinality key can be valuable with liquid clustering, but partitioning it as a directory would cause fragmentation. Patterns change: a column useful for yesterday's filters may not justify rewriting historical data. Top predicates and selectivity are collected, few keys are chosen, incremental optimization is executed and the percentage of pruned files, latency and maintenance cost are compared. A legitimate wide scan does not magically improve with skipping."
      ],
      "concepts": [
        {
          "term": "Statistics per file",
          "definition": "Metadata such as minimum, maximum, nulls, and count associated with a data file.",
          "whyItMatters": "Allows you to discard files without reading their contents when the predicate is out of range."
        },
        {
          "term": "pruning",
          "definition": "Deleting candidate files or partitions during read scheduling.",
          "whyItMatters": "Reduces I/O and downstream work; Query Profile allows you to measure how many bytes were avoided."
        },
        {
          "term": "Selectivity",
          "definition": "Fraction of the total set that satisfies a predicate.",
          "whyItMatters": "Selective filters get more value from a layout that groups its columns."
        }
      ],
      "workedScenario": {
        "situation": "A 90TB table receives events hourly, but support queries by tenant_id and event_time. Each query reads 60% of the files to return 0.02% of rows.",
        "reasoning": [
          "Extract the predicates from the history and confirm that tenant_id plus event_time dominate, measuring selectivity and pruned files in the baseline.",
          "Apply liquid clustering with those keys and incrementally optimize the active range without partitioning by high cardinality tenant.",
          "Compare bytes read, pruned files, P95 latency, and cost of OPTIMIZE for several weeks before reclustering cold data."
        ],
        "outcome": "Active queries read less than 2% of files and improve eight times; The team maintains only two keys and reviews the access pattern quarterly."
      }
    },
    "keyPoints": [
      "Skipping depends on statistics and physical distribution, not traditional row indices.",
      "Prioritizes columns present in selective and frequent filters.",
      "Measure pruned bytes/files with controlled cache."
    ],
    "decisions": [
      "Skipping depends on statistics and physical distribution, not traditional row indices.",
      "Prioritizes columns present in selective and frequent filters.",
      "Measure pruned bytes/files with controlled cache."
    ],
    "example": {
      "title": "Update statistics after changing skipping columns",
      "note": "Recomputing can be expensive on large tables; documents the change and compares bytes read before and after."
    },
    "pitfalls": [
      "Add many columns of statistics unrelated to predicates, increasing metadata and maintenance.",
      "Measure only a second query that already benefits from cache."
    ],
    "examDecision": "When a filter reads too many files, it first checks the statistics and layout of the filtered columns; more compute does not create pruning.",
    "checkpoint": {
      "question": "A query filters on `customer_id`, but all files contain IDs from the entire range. Why will skipping be weak?",
      "answer": "Because the min/max of almost all files could contain the ID and the engine cannot discard them even if the filter is selective."
    }
  },
  "m24-l3": {
    "summary": "Use liquid clustering to adapt the layout to changing access patterns without inheriting the rigidity of high cardinality physical partitions.",
    "explanation": [
      "Liquid clustering replaces partitioning and `ZORDER` for new tables that need flexible layout. `CLUSTER BY` defines keys and housekeeping operations incrementally regroup data. Keys can evolve without immediately rewriting the entire table; Reads and writes require compatible versions of the runtime and you should not mix the table with traditional or `ZORDER` partitioning.",
      "Automatic liquid clustering uses predictive optimization to choose and evolve keys when the expected savings from skipping exceed the cost of clustering. The practical decision is based on observed queries: filters by date and client can justify keys, while an extreme cardinality column without a stable pattern can worsen maintenance. Validate in history and profiles which files are pruned."
    ],
    "deepDive": {
      "mentalModel": "Liquid clustering separates the logical identity of a table from its physical organization. Instead of setting partition directories that each row must inhabit forever, declare some clustering keys and let OPTIMIZE incrementally organize files to promote data skipping. Keys can change without immediately rewriting the entire history; new data and future optimizations follow the new intent. This makes the layout adaptable to high cardinality, skew and changing queries. It does not mean that a declaration instantly reorders existing files: activating or changing keys establishes future policy, and only clustering work, automatic or explicit, gradually realizes the benefit.",
      "mechanics": [
        "A liquid clustered table uses domains and clustering metadata to record how files are grouped. CLUSTER BY defines keys; OPTIMIZE incrementally rewrites the files that need organization, and the engine then uses the statistics for skipping. Liquid clustering does not combine with partitions or ZORDER on the same table. Changing keys affects future operations; OPTIMIZE FULL can force reclustering when the runtime version supports it. CLUSTER BY AUTO requires predictive optimization and selects keys from observed patterns.",
        "Adaptability reduces directory explosions and migrations, but clustering consumes compute and rewrites. Rarely used keys or too many columns may not recover their cost; Keys with strong correlation may be redundant. Readers must support enabled protocol features, including deletion vectors as configured. The decision combines selectivity, frequency, growth, concurrency and compatibility. You start with new tables or hot ranges, measure skipping and allow incremental optimization to act before ordering an expensive FULL."
      ],
      "concepts": [
        {
          "term": "Clustering key",
          "definition": "Column declared as a signal to physically group values into files without creating partition directories.",
          "whyItMatters": "Improves data skipping and can change as the query pattern evolves."
        },
        {
          "term": "Incremental clustering",
          "definition": "Rewrite only files that require reorganization during optimization operations.",
          "whyItMatters": "It avoids reclassifying the entire table on each run and makes ongoing maintenance feasible."
        },
        {
          "term": "OPTIMIZE FULL",
          "definition": "Mode that forces broader reclustering of existing data into compatible liquid-clustered tables.",
          "whyItMatters": "It materializes new keys historically, but its cost requires a clear reason and operational window."
        }
      ],
      "workedScenario": {
        "situation": "A table partitioned by country produces a 45 TB directory for the United States and tiny thousands for small countries; queries now filter account_id.",
        "reasoning": [
          "Quantify skew, file sizes and predicates, and verify that account_id has stable selectivity while country no longer prunes effectively.",
          "Create a liquid-clustered table by account_id and event_date or convert it with a supported route, validating protocol and consumers before the change.",
          "Migrate by windows, compare counts and skipping, and reserve OPTIMIZE FULL only for history whose expected benefit exceeds the rewrite."
        ],
        "outcome": "The dependency on unbalanced directories disappears, maintenance becomes incremental and P95 drops 65% without thousands of small partitions."
      }
    },
    "keyPoints": [
      "Liquid clustering supports key evolution without redefining physical partitions.",
      "Do not combine `CLUSTER BY` with `PARTITIONED BY` or `ZORDER` in the same strategy.",
      "Automatic liquid clustering requires predictive optimization."
    ],
    "decisions": [
      "Liquid clustering supports key evolution without redefining physical partitions.",
      "Do not combine `CLUSTER BY` with `PARTITIONED BY` or `ZORDER` in the same strategy.",
      "Automatic liquid clustering requires predictive optimization."
    ],
    "example": {
      "title": "Create a table with liquid clustering",
      "note": "Choose keys from real filters; Enabling clustering does not guarantee benefit if the queries do not prune those columns."
    },
    "pitfalls": [
      "Replicate the old partition column as key without reviewing the query history.",
      "Perform aggressive manual maintenance while predictive optimization already manages the table."
    ],
    "examDecision": "Prefer liquid clustering for new Delta tables with evolving filter patterns; Use partitioning only when there is a specific compatibility reason.",
    "checkpoint": {
      "question": "What advantage does changing liquid clustering keys offer compared to changing traditional partitions?",
      "answer": "Keys can evolve and reclustering occurs incrementally, without requiring an immediate and complete rewrite of the layout."
    }
  },
  "m24-l4": {
    "summary": "Relates deletion vectors, predictive I/O, and row concurrency to the actual cost of `MERGE`, `UPDATE`, and `DELETE`.",
    "explanation": [
      "Without deletion vectors, modifying a few rows may require rewriting entire Parquet files. With the feature enabled, Delta records which rows are logically deleted and defers the physical writeback. Photon can use predictive I/O to speed up compatible updates and reads; the table protocol is elevated, so all external clients must support it.",
      "Vectors do not eliminate maintenance: subsequent operations materialize changes when appropriate, and `VACUUM` is still governed by retention. They also enable row-level concurrency on eligible tables, reducing conflicts between writes to different rows. Disabling them out of habit can lose concurrency; activating them without inventorying external readers can break interoperability."
    ],
    "deepDive": {
      "mentalModel": "A deletion vector is a layer of indirection between the physical file and the visible logical version of the table. Instead of rewriting an entire Parquet to change a few rows, the transaction records which positions are deleted or replaced; the reads query that flag and reconstruct the current state. Photon can leverage this mechanism for predictive I/O on UPDATE, DELETE, and MERGE, and Delta can enable row-level concurrency in supported configurations. Saving writes shifts some of the work to reading and subsequent maintenance. Old bytes do not disappear immediately: REORG and VACUUM, with safe retention, materialize and purge when appropriate.",
      "mechanics": [
        "Without deletion vectors, a selective modification typically reads and rewrites each affected file. With them, the commit adds compact metadata that identifies logically removed rows; Supported readers apply the mask and maintain transactional isolation. Predictive I/O with Photon optimally decides which portions to touch. Per-row concurrency reduces conflicts between modifications that affect different rows, but requires features such as row tracking and compatible runtimes. DESCRIBE DETAIL and history help verify protocol, features and operations, not just the time of a MERGE.",
        "The advantage decreases when almost all rows in a file change or when external readers do not support the protocol. Many accumulated marks can add reading work; REORG TABLE APPLY (PURGE) rewrites data to perform deletes and then VACUUM deletes old files only when retention and consumers allow it. Disabling deletion vectors can remove concurrency per row and make DML more expensive. Before enabling, readers, physical erase SLA, change frequency, and rollback compatibility would be inventoried."
      ],
      "concepts": [
        {
          "term": "Deletion vector",
          "definition": "Metadata that identifies logically deleted row positions without immediately rewriting your file.",
          "whyItMatters": "Reduces write amplification on selective changes and enables compatible optimizations and concurrency."
        },
        {
          "term": "Row-level concurrency",
          "definition": "Ability to resolve write conflicts over separate rows instead of the entire file.",
          "whyItMatters": "Improves concurrent MERGE, UPDATE, and DELETE throughput when table requirements are met."
        },
        {
          "term": "physical purge",
          "definition": "Rewriting and subsequent deletion of files that still contain bytes of logically deleted rows.",
          "whyItMatters": "A quick logical delete does not by itself satisfy physical erase or storage reduction requirements."
        }
      ],
      "workedScenario": {
        "situation": "An 18 TB profile table receives four concurrent MERGE per region and delete requests; rewriting files causes conflicts and 9 TB per day of write amplification.",
        "reasoning": [
          "Verify that table, runtime and all readers support deletion vectors and row tracking, and separate logical SLA from physical purge SLA.",
          "Enable features on a test clone, reproduce concurrency, and measure conflicts, file rewrites, read latency, and MERGE duration.",
          "Schedule REORG for eligible ranges and VACUUM after approved retention, auditing that no stream or rollback depends on deleted versions."
        ],
        "outcome": "Conflicts drop drastically and the DML ends four times early; a governed process completes the physical erase without breaking operational time travel."
      }
    },
    "keyPoints": [
      "Deletion vectors avoid immediately rewriting entire files for changes of just a few rows.",
      "Checks protocol compatibility of all readers and writers.",
      "Predictive I/O for updates requires Photon and uses deletion vectors."
    ],
    "decisions": [
      "Deletion vectors avoid immediately rewriting entire files for changes of just a few rows.",
      "Checks protocol compatibility of all readers and writers.",
      "Predictive I/O for updates requires Photon and uses deletion vectors."
    ],
    "example": {
      "title": "Enable vectors and verify protocol",
      "note": "Check `tableFeatures` in `DESCRIBE DETAIL` and pre-validate each external engine that accesses the table."
    },
    "pitfalls": [
      "Activate a protocol feature without testing external Delta consumers.",
      "Confuse immediate logical deletion with secure physical deletion of files."
    ],
    "examDecision": "Use deletion vectors for frequent DML and compatible concurrency; prioritizes interoperability when there is a reader that does not support the feature.",
    "checkpoint": {
      "question": "Why doesn't `DELETE` with deletion vectors mean that the old file disappears immediately?",
      "answer": "The row is logically marked; rewriting and physical deletion are performed later according to maintenance and retention."
    }
  },
  "m24-l5": {
    "summary": "Delegates `OPTIMIZE`, `VACUUM` and `ANALYZE` to predictive optimization when the managed table and its governance allow it.",
    "explanation": [
      "Predictive optimization observes tables managed by Unity Catalog and performs maintenance where it sees benefit: compact and apply clustering with `OPTIMIZE`, delete unreferenced files with `VACUUM` and maintain statistics using `ANALYZE`. It can be enabled in account, catalog, schema or table, with inheritance; External tables are under the responsibility of the owner.",
      "Automating does not mean losing control. Review the effective ownership with `DESCRIBE ... EXTENDED`, the trading history and the cost attributed to `PREDICTIVE_OPTIMIZATION` in `system.billing.usage`. Avoid cron jobs that execute `OPTIMIZE` on all tables without observing the need: they compete with automation and can spend more than the profit obtained."
    ],
    "deepDive": {
      "mentalModel": "Predictive optimization turns the maintenance of tables managed by Unity Catalog into a managed control loop. The platform observes activity and decides when to run OPTIMIZE, VACUUM and ANALYZE to improve layout, remove unreferenced files and maintain statistics, instead of requiring identical schedules for thousands of tables. It is not a button that eliminates responsibility: it only operates on eligible objects, consumes serverless resources and must coexist with retention, readers and policies. Its advantage is to adjust frequency to the real need. The engineer retains the contract: enablement, observability, compatibility, exceptions and removal of manual jobs that would duplicate work or compete with the service.",
      "mechanics": [
        "On eligible managed tables, predictive optimization uses telemetry to launch maintenance operations. OPTIMIZE compacts and, with liquid clustering, groups incrementally; ANALYZE updates statistics that help the optimizer; VACUUM removes files that are no longer referenced and exceed retention. The execution is logged and can be monitored using system tables or available history. Automatic key selection with CLUSTER BY AUTO also depends on predictive optimization. It does not act the same on external tables, formats or unsupported regions, so eligibility is explicitly checked.",
        "Maintaining scheduled OPTIMIZE jobs at the same time can double rewrites and cost; After enabling, they are deactivated in a controlled manner and the service is observed. Aggressive retention still threatens delayed streams or time travel, and the fact that VACUUM is automatic does not redefine legal requirements. Some critical tables may require special windows or strategies. The evaluation compares total maintenance cost, small files, skipping, freshness of statistics and failures before and after, with a documented exception plan."
      ],
      "concepts": [
        {
          "term": "Eligible managed table",
          "definition": "Table governed by Unity Catalog whose property and characteristics allow automatic maintenance by the platform.",
          "whyItMatters": "Predictive optimization is not a universal solution for external tables or incompatible configurations."
        },
        {
          "term": "ANALYZE",
          "definition": "An operation that collects statistics used by the optimizer to estimate sizes and cardinalities.",
          "whyItMatters": "Improves join and planning decisions; Outdated statistics can produce fragile plans."
        },
        {
          "term": "maintenance loop",
          "definition": "Cycle that observes usage, runs optimization, and remeasures the state of the table.",
          "whyItMatters": "Adapt frequency to real activity instead of applying fixed calendars to all tables."
        }
      ],
      "workedScenario": {
        "situation": "One platform maintains 3,800 tables with identical night jobs; 70% does not change daily and active tables accumulate small files before the window.",
        "reasoning": [
          "Inventory eligibility, retention, readers and current cost per board, distinguishing wasteful maintenance from delays on hot boards.",
          "Enable predictive optimization for a pilot domain, phase out its duplicate jobs, and record automatic operations and layout metrics.",
          "Compare cost, file size, pruning, statistics, and SLA over a full cycle, keeping exceptions for unsupported contracts."
        ],
        "outcome": "Maintenance is concentrated when it adds value, the associated expense is reduced by 37% and hot tables are improved without manual calendars per object."
      }
    },
    "keyPoints": [
      "Only eligible managed tables receive predictive optimization.",
      "The configuration inherits from account, catalog and schema unless explicit override.",
      "Audit both profit and consumption of automatic operations."
    ],
    "decisions": [
      "Only eligible managed tables receive predictive optimization.",
      "The configuration inherits from account, catalog and schema unless explicit override.",
      "Audit both profit and consumption of automatic operations."
    ],
    "example": {
      "title": "Enable by catalog and check a table",
      "note": "Inheritance does not override an explicit `DISABLE` on a child; Verifies the effective configuration before diagnosing lack of maintenance."
    },
    "pitfalls": [
      "Assume that an external table is automatically maintained because it is registered in Unity Catalog.",
      "Keep a global job of `OPTIMIZE` and `VACUUM` without checking to see if it duplicates predictive optimization."
    ],
    "examDecision": "For managed tables, enables predictive optimization and eliminates indiscriminate maintenance; For external ones, design and observe your own policy.",
    "checkpoint": {
      "question": "What three main operations does predictive optimization perform?",
      "answer": "`OPTIMIZE`, `VACUUM` and `ANALYZE`, selectively applied to eligible managed tables."
    }
  },
  "m25-l1": {
    "summary": "Choose serverless, SQL warehouse or classic compute based on APIs, latency, infrastructure control and operating pattern.",
    "explanation": [
      "Databricks recommends serverless for most notebooks, jobs, and pipelines because it handles provisioning, scaling, Photon, and updates. A serverless SQL warehouse serves BI and SQL; Serverless jobs serves automated tasks without configuring a cluster. Classic Compute is still valid when an API, runtime, network, or specialized configuration is not supported in serverless.",
      "The decision is made by requirement, not by historical preference. Defines startup and execution SLA, language, libraries, connectivity and available observability. In serverless there is no Spark UI: Query Profile is used. In classic you control families and autoscaling, but also capacity, patches and idle time. Avoid all-purpose for automated production unless an explicit exception."
    ],
    "deepDive": {
      "mentalModel": "Choosing compute is choosing an operating contract, not a machine size. Serverless delivers managed capacity with abstracted startup, scaling, and updates; a SQL warehouse provides a governed, concurrent endpoint for SQL and BI; classic compute exposes instance families, drivers, workers, runtimes, and policies for workloads that need that control. All three options execute work, but differ in supported APIs, isolation, preparation latency, operation responsibility, and billing. The starting point is the workload properties: language, state, duration, concurrency, dependencies, private network, predictability and SLA. Personal preference for a cluster type is not a technical requirement.",
      "mechanics": [
        "Serverless provisions Databricks-managed resources for supported tasks and reduces infrastructure decisions; the platform manages runtime and capacity within its limits. A SQL warehouse separates the query endpoint from the clients and applies queuing, autoscaling, and Photon for SQL concurrency. Classic compute creates drivers and executors with explicit configuration, useful when libraries, runtimes, topology or connectivity not covered by serverless are required. The compatibility matrix and access mode must be verified before assuming functional equivalence.",
        "Managed abstraction reduces toil, but may limit Spark settings, versions, or network access; classic control increases responsibility for startup, policies, updates and oversizing. An interactive warehouse optimizes latency and concurrency, while a long job can prioritize cost per job. A decision table is built with mandatory requirements and then the candidate is tested with SLA, concurrency, security and real cost. Code portability does not guarantee environment or credential portability."
      ],
      "concepts": [
        {
          "term": "Compute contract",
          "definition": "Set of capabilities, limits and operational responsibilities associated with an execution modality.",
          "whyItMatters": "Avoid choosing only by name or price when an API, network or dependency can block the workload."
        },
        {
          "term": "SQL warehouse",
          "definition": "Compute resource aimed at SQL queries, BI and concurrency through a managed endpoint.",
          "whyItMatters": "Isolates clients from the compute lifecycle and provides specific queuing and scaling controls."
        },
        {
          "term": "Classic computing",
          "definition": "Compute with explicit drivers, workers, runtime, and infrastructure configuration.",
          "whyItMatters": "Provides control for special requirements in exchange for greater operation and sizing risk."
        }
      ],
      "workedScenario": {
        "situation": "A company must run Python ingestion with a native library, 300-user dashboards, and hourly SQL transformations, all under a common catalog.",
        "reasoning": [
          "Separate requirements: the ingestion library and network, interactive BI concurrency and serverless compatibility of transformations, without imposing a single compute.",
          "Map classic compute governed to ingestion, an autoscaling SQL warehouse to BI, and serverless jobs to supported SQL; define identities per workload.",
          "Test data paths, spikes, startup, cost per run, and permissions, and document an alternative if a serverless capability changes availability."
        ],
        "outcome": "Every load gets the right contract, dashboards stop competing with ETL, and the team eliminates a shared cluster that was expensive and difficult to govern."
      }
    },
    "keyPoints": [
      "Serverless is the default option for supported workloads.",
      "SQL warehouse corresponds to SQL/BI; Serverless jobs to general automation supported.",
      "Classic Compute is justified by a specific limitation, not by habit."
    ],
    "decisions": [
      "Serverless is the default option for supported workloads.",
      "SQL warehouse corresponds to SQL/BI; Serverless jobs to general automation supported.",
      "Classic Compute is justified by a specific limitation, not by habit."
    ],
    "example": {
      "title": "compute decision log",
      "note": "The decision includes a fallback and review date; avoid declaring serverless or classic as dogma."
    },
    "pitfalls": [
      "Use all-purpose sharing for a critical job and mix its cost with interactive work.",
      "Migrate to serverless without reviewing unsupported Spark configurations, sinks or dependencies."
    ],
    "examDecision": "Start with serverless; choose classic only when a verified requirement is not covered and document how to remove the exception.",
    "checkpoint": {
      "question": "When would you choose a SQL warehouse over serverless jobs?",
      "answer": "When the load is SQL/BI and you need the capabilities and concurrency of the warehouse; For Python tasks or general workflows, serverless jobs tend to be a better fit."
    }
  },
  "m25-l2": {
    "summary": "Dimensiona compute classic with the real bottleneck: memory per partition, CPU, I/O, parallelism and driver capacity.",
    "explanation": [
      "More small nodes and few large nodes can add similar cores and memory, but they do not behave the same. Joins and aggregations with large partitions require memory per executor; Highly parallel workloads can take advantage of more workers. The driver schedules, collects metadata, and receives results from actions like `collect()`, so scalar workers does not resolve an overloaded driver.",
      "It starts with a general family, autoscaling, and observable boundaries. Check CPU utilization, memory, spill, I/O and duration per stage; change one variable at a time. In AWS, Azure and GCP names, disks and spot markets vary, but the method is the same. Keep the driver on demand and use spot/preemptible on workers only if the workload tolerates interruptions."
    ],
    "deepDive": {
      "mentalModel": "Sizing classic compute is balancing a distributed system with two different scales: resources per task and number of simultaneous tasks. The memory required by a partition determines whether each executor can complete its operator; The number of cores and executors determines how much parallelism is realized. The driver has another function: it plans, coordinates, collects metadata and can collapse even if the workers are idle if the code collects or creates a huge plan. A larger machine is no substitute for good partitioning, and more workers do not fix an indivisible task. The bottleneck is first measured with CPU, I/O, spill, GC, task distribution and driver pressure.",
      "mechanics": [
        "Spark assigns tasks to slots based on cores and executors; each task normally processes a partition and shares executor resources. Scaling horizontally increases slots and aggregate bandwidth, as long as there are enough partitions and the source allows parallelism. Scaling up provides more memory and CPU per executor, useful for legitimately large partitions, but can extend GC pauses or reduce isolation. The driver needs capacity according to the number of tasks, plan size and coordinated results, not the total volume of stored data.",
        "A CPU-bound stage with high utilization can benefit from more cores; a stage with storage waiting requires reviewing throughput and file sizes; spill by skew requires redistribution. Autoscaling reacts to demand, but does not eliminate acquisition time or accelerate a single sequential stage. The test uses peak volume and records utilization per node, maximum and median task, cost, duration, and errors. The chosen configuration is encoded in a policy and preserves room for variation, avoiding optimization to the limit of a sample."
      ],
      "concepts": [
        {
          "term": "Horizontal scaling",
          "definition": "Increase in the number of workers or executors to have more slots and added throughput.",
          "whyItMatters": "It only accelerates if the plan offers parallelism and the stage does not depend on a hot or sequential task."
        },
        {
          "term": "Vertical scaling",
          "definition": "Use of nodes with more CPU or memory per execution process.",
          "whyItMatters": "It can fit large partitions, but increases unit cost and does not correct poor layout."
        },
        {
          "term": "Driver pressure",
          "definition": "Planning, metadata, or results upload that consumes memory and CPU of the coordinator process.",
          "whyItMatters": "A driver can fail even if the executors have resources; collect and huge plans are different signals."
        }
      ],
      "workedScenario": {
        "situation": "A job has workers at 35% CPU, driver at 98%, millions of tiny tasks and long pauses before starting stages; adding ten workers does not improve the time.",
        "reasoning": [
          "Separate planning and execution time, measure the number of tasks and review the code for collect, loops that create unions and excessively small files.",
          "Compact entries, simplify the plan, and delete collections; size the driver for the remaining coordination before increasing workers.",
          "Execute with several scales, verifying driver time, worker throughput, cost and that the result preserves counts and schema."
        ],
        "outcome": "The plan starts in seconds, the worker CPU is used effectively and the job drops from 80 to 26 minutes with fewer nodes, not with a larger cluster."
      }
    },
    "keyPoints": [
      "Size by critical stage resources, not by total table volume.",
      "The driver and the workers have different responsibilities.",
      "Autoscaling does not fix skew or a single non-parallelizable task."
    ],
    "decisions": [
      "Size by critical stage resources, not by total table volume.",
      "The driver and the workers have different responsibilities.",
      "Autoscaling does not fix skew or a single non-parallelizable task."
    ],
    "example": {
      "title": "Autoscaling range for a classic job",
      "note": "The node types are deliberately external to the example because they change by cloud; select them after profiling CPU, memory and disk."
    },
    "pitfalls": [
      "Raise `max_workers` when a single biased task dominates the duration.",
      "Use spot/preemptible for the driver and expose the entire job to a claim."
    ],
    "examDecision": "If parallelism is missing, add workers; whether each task spills memory, improves the plan or uses older workers; if the driver fails, treat the driver and remove local actions.",
    "checkpoint": {
      "question": "A job has low CPU on almost all workers and a single 40-minute task. Will duplicating `max_workers` help?",
      "answer": "Probably not; the stage does not use available parallelism. You have to investigate skew, partitioning or a serial operation."
    }
  },
  "m25-l3": {
    "summary": "Balance cost and latency in serverless through performance modes, versioned environments, and microbatch limits.",
    "explanation": [
      "Serverless jobs and pipelines offer performance optimized mode for fast startup and standard mode for automations that tolerate approximately 4–6 minutes of startup in exchange for lower cost. Notebooks use the appropriate interactive mode. Serverless manages infrastructure and Photon, but the engineer still controls the form of the query, packets, parameters, and how much data each execution processes.",
      "Serverless environments replace the direct selection of the Databricks Runtime and maintain a stable base API. Fix package versions and use base environments, because init scripts are not supported. In serverless streaming, `Trigger.AvailableNow` processes what is available; limit `maxFilesPerTrigger` or `maxBytesPerTrigger` to avoid unpredictable microbatches."
    ],
    "deepDive": {
      "mentalModel": "Serverless moves control from individual nodes to service targets. The engineer no longer chooses each instance or an arbitrary init script; It expresses the type of workload, its supported dependencies, parallelism and limits, and evaluates latency, cost and stability as observed properties. Performance modes trade speed of provisioning and response for consumption, while versioned environments reduce runtime variation. In streaming, the microbatch size connects two worlds: large batches take advantage of throughput but increase latency and temporal state; Small batches react faster but pay more overhead. The absence of a visible cluster does not eliminate design decisions, it only changes the permitted levers.",
      "mechanics": [
        "Serverless allocates capacity from a managed fleet and applies a compatible environment to the workload; The options shown depend on the product and region. Autoscaling responds to backlog and demand without the user configuring specific workers. Setup, execution and waiting times are observed separately in jobs and pipelines. Dependencies must be declared using supported mechanisms and fixed for reproducibility; Spark configurations or local access that worked in classic compute may be restricted. Query Profile and system tables replace part of the host inspection.",
        "Choosing a faster mode can reduce SLA and total cost if it shortens active capacity, but it can also increase rates or be unnecessary in night batches. For streaming, maxBytesPerTrigger or other limits control work per microbatch; restricting too much prevents you from reaching the source, and expanding too much worsens latency and risk. Input rate, processing rate, backlog, duration, cost and errors under peaks are measured. Optimizations should be kept within supported APIs, with configuration rollback and fixed environment."
      ],
      "concepts": [
        {
          "term": "Serverless environment",
          "definition": "Versioned set of runtime and supported dependencies used by managed compute.",
          "whyItMatters": "It provides reproducibility without full image control and forces dependencies to be declared in a supported way."
        },
        {
          "term": "Backlog",
          "definition": "Available work that has not yet been processed by the service.",
          "whyItMatters": "Guides scaling and shows if the sustained throughput meets the input rate."
        },
        {
          "term": "Microbatch limit",
          "definition": "Restriction of data processed in each shot of a stream.",
          "whyItMatters": "Balances latency, throughput, state, cost, and ability to recover after an interruption."
        }
      ],
      "workedScenario": {
        "situation": "A serverless stream normally receives 80 GB/h and peaks of 700 GB/h. After a peak, each microbatch lasts 22 minutes and the fraud dashboard is left behind by two hours.",
        "reasoning": [
          "Compare input rate, processing rate, backlog, and duration per batch to confirm that the limit and state, not the source, form the neck.",
          "Test higher limits and an appropriate performance mode in a controlled replay, checking state memory, SLA and cost per GB processed.",
          "Set environment and validated parameters, add backlog alerts and define a temporary catch-up mode that is removed when the stable state is recovered."
        ],
        "outcome": "The pipeline absorbs the peak in 38 minutes without losing guarantees; accelerated mode is activated only during catch-up and the normal cost remains stable."
      }
    },
    "keyPoints": [
      "Use standard mode when the SLA supports more startup and cost prevails.",
      "Set package versions within the serverless environment model.",
      "Managed infrastructure does not eliminate the need to limit each workload."
    ],
    "decisions": [
      "Use standard mode when the SLA supports more startup and cost prevails.",
      "Set package versions within the serverless environment model.",
      "Managed infrastructure does not eliminate the need to limit each workload."
    ],
    "example": {
      "title": "Reproducible dependencies for serverless",
      "note": "Don't depend on an unfixed transitive version; validate the environment under test before promoting it."
    },
    "pitfalls": [
      "Choose performance optimized for thousands of batch jobs whose SLA tolerates standard startup.",
      "Copy init scripts from classic compute to a serverless migration."
    ],
    "examDecision": "For startup-tolerant scheduled batch, use standard mode; retains optimized performance for interaction or demanding startup SLA.",
    "checkpoint": {
      "question": "What trade-off does the standard mode of serverless jobs introduce?",
      "answer": "Accepts a slower startup to reduce cost compared to performance optimized mode."
    }
  },
  "m25-l4": {
    "summary": "Enforce guardrails with compute policies and attribute serverless through usage policies without including sensitive information in tags.",
    "explanation": [
      "Compute policies restrict the creation of classic compute: they can set runtime, access mode, Photon, worker limits, autotermination and tags. Policy families provide databases maintained by Databricks. A good policy reduces dangerous options and leaves editable only parameters that the team must decide; installing libraries through policies is preferable to init scripts.",
      "Serverless usage policies are distinct objects that assign cost tags to notebooks, jobs, pipelines, and other serverless workloads. Your tags appear in `system.billing.usage.custom_tags`. Tags travel to records and can be replicated globally: use cost center, product and environment, never email, customer name or confidential data. Remember that a pipeline triggered by a job retains its own policy."
    ],
    "deepDive": {
      "mentalModel": "A policy is an executable guardrail: it transforms cost, security and support standards into permitted options before the compute is born. It does not replace RBAC or decide who can read data; limits how the infrastructure is configured, for example runtime, family, Photon, autoscaling, autotermination or tags. In serverless, a usage policy is used to attribute consumption based on available metadata and context, not to insert secrets into tags. Good governance offers approved paths for workload classes, with sensible defaults and explicit limits. A policy that is too open does not control; one that is too rigid causes manual exceptions and teams that mix incompatible loads into a single resource.",
      "mechanics": [
        "Compute policies express JSON rules on API attributes: fixed values, allowed values, ranges, defaults or prohibited options. The user needs permission to use the policy and can only create configurations within the contract. Rules can impose autotermination, families, worker limits, runtimes, and technical tags; some values ​​may be hidden. Usage policies for serverless allow you to classify and attribute usage based on account policies. System.billing.usage then exposes usage_metadata, identity_metadata, and custom_tags for governed analysis.",
        "A tag travels to telemetry and billing, so it should not contain customer names, personal data, or credentials. Optional tags degrade quickly; Required fields without taxonomy generate inconsistent values. Few stable categories are designed such as cost_center, environment and workload_class, with owners and catalog. Exceptions require expiration and evidence. Allowed and denied creation, attribution in system tables and user experience are tested; Policies are then reviewed when runtimes and capabilities change."
      ],
      "concepts": [
        {
          "term": "Compute policy",
          "definition": "Set of rules that limits and defaults attributes when creating classic compute.",
          "whyItMatters": "Prevents insecure or costly configurations without relying on subsequent manual review."
        },
        {
          "term": "Usage policy",
          "definition": "Classification and attribution mechanism for the consumption of serverless products.",
          "whyItMatters": "Allows FinOps when there is no own cluster to which traditional tags can be attached."
        },
        {
          "term": "Cost taxonomy",
          "definition": "Controlled vocabulary of dimensions such as center, environment, product and workload class.",
          "whyItMatters": "Makes attribution aggregable and avoids hundreds of equivalent or sensitive tags."
        }
      ],
      "workedScenario": {
        "situation": "One hundred and twenty computers create compute with obsolete runtimes, no self-termination, and free tags that include client names; 34% of usage cannot be attributed.",
        "reasoning": [
          "Define approved development, job and exception classes, with worker limits, supported runtime, autotermination and a mandatory non-sensitive taxonomy.",
          "Implement and test policies with pilot groups, and usage policies for serverless, verifying both rejections and valid self-service routes.",
          "Consult billing to measure attribution coverage, correct values and establish expiration and review for documented exceptions."
        ],
        "outcome": "Attribution reaches 98%, orphan compute disappears, and teams retain self-service through three clear templates instead of manual requests."
      }
    },
    "keyPoints": [
      "Compute policies govern classic configuration; serverless usage policies attribute serverless activity.",
      "Fixed and hidden guardrails, allowing only necessary decisions.",
      "Tags are not a secure store for personal or secret data."
    ],
    "decisions": [
      "Compute policies govern classic configuration; serverless usage policies attribute serverless activity.",
      "Fixed and hidden guardrails, allowing only necessary decisions.",
      "Tags are not a secure store for personal or secret data."
    ],
    "example": {
      "title": "Compute policy fragment with guardrails",
      "note": "Complete the policy with family and workspace rules; Tests that intended users can create compute and cannot overcome guardrails."
    },
    "pitfalls": [
      "Use the same `Name` tag that Databricks applies to the cluster and break attribution/termination.",
      "Include personal or secret identifiers in cost tags."
    ],
    "examDecision": "Use policies to prevent expensive configurations and stable tags for chargeback; do not trust in the manual discipline of the creator.",
    "checkpoint": {
      "question": "Where do tags inherited from a serverless usage policy appear?",
      "answer": "In `custom_tags` of the corresponding `system.billing.usage` records."
    }
  },
  "m25-l5": {
    "summary": "Build FinOps with usage quantities, effective pricing, fixes, and workload metadata, not cluster hour estimates.",
    "explanation": [
      "`system.billing.usage` offers regional consumption records with SKU, product origin, job/notebook/warehouse metadata, identity and tags. For monetary cost, it is linked to the price table by SKU and validity; fixes can issue retractions and restatements, so add `usage_quantity` with its sign instead of discarding negative rows.",
      "A useful dashboard separates cost, volume and result: cost per execution, per million rows or per SLA met. Segment serverless by `billing_origin_product` and `usage_metadata`, because several capabilities share SKUs. Define budgets and alerts as early detection, not as a mechanism that automatically stops all workloads."
    ],
    "deepDive": {
      "mentalModel": "FinOps does not try to minimize each isolated invoice; optimizes the cost of delivering value reliably. In Databricks, usage records are temporal facts that must be joined with effective pricing, identity and resource metadata, and workload results. Cluster hours are a poor approximation for serverless, autoscaling, changing rates, or fixes. system.billing.usage includes quantities and metadata, but a record can be a retraction or correction and not all consumption is attributed equally. The useful unit is cost per successful pipeline, table published, terabyte processed or query with SLA. This normalization separates healthy growth from waste and avoids rewarding cheap jobs that fail.",
      "mechanics": [
        "Billing records contain time, SKU, unit and usage quantity, as well as resource, identity and product tag structures. To convert usage into amount, the price valid during the interval is applied, respecting currency, validity and possible negotiated prices available. Correction records may override or replace prior use; naively adding only positives overestimates cost. Attribution links job, warehouse, or compute IDs to operational system tables and distributes shared costs using an explicit rule.",
        "A dashboard without reconciliation produces false precision. First, the total is equalized with the official source by period; coverage, cost sharing and unknown are then classified. Optimizing by unit requires reliable denominators: successful runs, published rows, or SLA met. Lower cost with more retries can be worse. Trend, budget, anomaly, and attribution confidence are displayed, and each action retains ownership and verification. Tags support analysis, but identity and usage_metadata are typically more stable for serverless."
      ],
      "concepts": [
        {
          "term": "Correction log",
          "definition": "Billing entry that retracts or adjusts a previously published amount.",
          "whyItMatters": "It must be netted correctly so as not to duplicate use or show fictitious savings."
        },
        {
          "term": "Unit cost",
          "definition": "Amount divided by a comparable unit of value or work.",
          "whyItMatters": "Distinguishes increased spending due to growth from an efficiency regression."
        },
        {
          "term": "Attribution coverage",
          "definition": "Percentage of the cost assigned in a traceable way to owner, product or workload.",
          "whyItMatters": "It exposes how much of the dashboard is actionable and how much remains shared or unknown."
        }
      ],
      "workedScenario": {
        "situation": "Spending rises 42% and management demands cuts, but the processed volume doubled and a critical job repeats failed executions that does not publish data.",
        "reasoning": [
          "Reconcile usage with pricing and fixes, and match job IDs with runs to separate volume growth, failures, and shared capacity.",
          "Calculate cost per TB correctly published and per successful execution, showing retries and unattributed spending as independent dimensions.",
          "Prioritize the job with retries, validate its cause and measure real savings after the correction without reducing the SLA of efficient loads."
        ],
        "outcome": "The team avoids indiscriminate cutting, eliminates 19% of unproductive spending and demonstrates that the rest of the increase corresponds to better unit cost with more volume."
      }
    },
    "keyPoints": [
      "Add signed correction records to obtain net consumption.",
      "Combine usage and prices by SKU and validity period.",
      "Normalizes cost per business unit or completed work."
    ],
    "decisions": [
      "Add signed correction records to obtain net consumption.",
      "Combine usage and prices by SKU and validity period.",
      "Normalizes cost per business unit or completed work."
    ],
    "example": {
      "title": "Daily usage by product and cost center",
      "note": "For currency, join with `system.billing.list_prices` respecting SKU and period; This example avoids pretending that DBU directly equates to cost."
    },
    "pitfalls": [
      "Multiply all DBUs by a single price without considering SKU or contractual validity.",
      "Ignore negative corrections and overestimate historical consumption."
    ],
    "examDecision": "Use system tables for net cost and attribution; decide optimizations with cost per result and SLA, not just with total DBUs.",
    "checkpoint": {
      "question": "Why should we not filter records with `usage_quantity < 0`?",
      "answer": "They may be retractions of corrections; eliminating them leaves the original consumption uncompensated and distorts the total."
    }
  },
  "m26-l1": {
    "summary": "Read Spark UI from top to bottom: job, stage, task and executor, maintaining a hypothesis that connects time with data and resources.",
    "explanation": [
      "Spark UI is the detail tool for classic compute. Start with the timeline and the longest job, enter its critical stage and compare tasks. Scheduling delay signals lack of slots or overhead; shuffle read/write shows movement; spill, GC and extreme duration orient memory or skew. Executors allow you to check if the work was distributed and if there were losses.",
      "Don't turn every metric into a recipe. A stage with 90% time on a task does not improve with more workers; an I/O-bound stage may need better layout or pruning. Maintains job, stage and run IDs, captures percentiles and notes the analyzed plan or commit so that another person can reproduce the diagnosis."
    ],
    "deepDive": {
      "mentalModel": "Spark UI is a causal reconstruction of an execution. A job is born from an action; each job contains stages separated by exchanges; each stage executes equivalent tasks on partitions; executors provide processes, memory and cores. Reading from top to bottom avoids jumping to a flashy metric without context. First the critical path is identified, then the dominant stage, then the distribution by task and finally the resource that explains that distribution. The SQL plan connects those metrics with business data and operators. A complete hypothesis sounds like this: this join produces a shuffle, a key concentrates bytes, five tasks spill to disk and determine the duration. It is not enough to say that the cluster is slow.",
      "mechanics": [
        "The Jobs tab shows actions and DAG; Stages features input, output, shuffle, spill, GC, and task distributions; Executors summarize memory, tasks, faults, and activity by process; SQL/DataFrame binds operators to the plan. A stage retry can create several attempts and the accumulated ones must be interpreted without mixing attempts. Percentiles and maximums reveal tails that totals hide. The event timeline helps distinguish work, wait, fetch and GC. Correlating to a query or run ID preserves traceability between UI and orchestration.",
        "The UI of an individual run does not replace historical trends and may disappear depending on retention. Saving only snapshots loses structured data and context. During an incident, application ID, run ID, stage and attempt, timestamps, plan and key metrics are recorded. One variable at a time is modified, it is repeated with comparable input and the correctness of the result is confirmed. Low CPU can mean I/O, missing tasks, queuing or remote waiting; it is checked with stages and executors before scaling."
      ],
      "concepts": [
        {
          "term": "stage",
          "definition": "Set of tasks that can be executed without a new shuffle and share the same local physical plan.",
          "whyItMatters": "It locates the border where distribution and dependence change, allowing the critical path to be located."
        },
        {
          "term": "Task attempt",
          "definition": "Concrete execution of a task, including a repetition after failure or speculation.",
          "whyItMatters": "Mixing attempts can inflate metrics and hide that reliability, not volume, causes time."
        },
        {
          "term": "Critical path",
          "definition": "Chain of stages and tasks that determines the minimum completion time of the job.",
          "whyItMatters": "Optimizing parallel work outside of that chain may not improve SLA."
        }
      ],
      "workedScenario": {
        "situation": "A job lasts 55 minutes; The cluster dashboard shows average CPU of 22%, but a final stage consumes 41 minutes and has three attempts.",
        "reasoning": [
          "Open the job and isolate the critical stage by attempt, distinguishing original time from retries and observing task distribution and fetch failures.",
          "Link the stage to the plan exchange and review lost executors, shuffle fetch, spill and skew to formulate a verifiable cause.",
          "Correct shuffle stability, repeat with the same snapshot and compare attempts, task maximum, duration and final count."
        ],
        "outcome": "Insufficient local storage is identified on two executors, retries disappear and the job finishes in 17 minutes without confusing average CPU with missing capacity."
      }
    },
    "keyPoints": [
      "Navigate from the overall duration to the task that explains the neck.",
      "Correlates time, bytes, registers, spill and executor.",
      "Saves identifiers and baseline for reproducibility."
    ],
    "decisions": [
      "Navigate from the overall duration to the task that explains the neck.",
      "Correlates time, bytes, registers, spill and executor.",
      "Saves identifiers and baseline for reproducibility."
    ],
    "example": {
      "title": "Tag a run before opening Spark UI",
      "note": "The job group makes it easy to locate the correct run; Do not record secrets or personal data in the description."
    },
    "pitfalls": [
      "Look only at the Executors page and miss the specific stage that causes the problem.",
      "Compare a cold run with a hot run without registering cache and volume."
    ],
    "examDecision": "In classic compute, start with the timeline, go down to the longest stage and decide on the distribution of tasks before changing resources.",
    "checkpoint": {
      "question": "What view would you use to show that five tasks concentrate the shuffle of a stage?",
      "answer": "The details of the stage and its tasks table in Spark UI, comparing shuffle bytes and duration per task."
    }
  },
  "m26-l2": {
    "summary": "Uses Query Profile for serverless and SQL warehouses, separating queuing, scheduling, pruning, and execution by operator.",
    "explanation": [
      "Query Profile visualizes the DAG of operators and metrics such as rows, time, memory, and I/O. The summary distinguishes wall-clock from aggregate task time: the second can be greater because it adds parallel work. Top operators reveal full scans, explosive joins and expensive aggregations; pruning flags show whether the layout avoids reading irrelevant data.",
      "In serverless there is no Spark UI, so Query Profile and query history are the main route. A query served from cache may not have a profile; harmlessly changes the query for a controlled measurement. Use CAN MONITOR on the warehouse or practice property, and grant access to the minimum necessary operating group."
    ],
    "deepDive": {
      "mentalModel": "Query Profile is the time and motion map of a query in managed compute. Total latency is decomposed into queuing, preparation, and execution; within the execution, each operator consumes rows, bytes, CPU and time and produces others. That separation is essential: scaling a warehouse doesn't fix an inefficient expression if the neck is running, and rewriting SQL doesn't eliminate a queue caused by concurrency. The profile allows you to follow the flow from scanning and pruning to joins, aggregations and writes, observe Photon and detect cardinality explosions. The operator with the most time is not always the original cause: it can process the excess generated by a previous join.",
      "mechanics": [
        "In SQL warehouses and serverless, the profile records query phases and a DAG of operators. The scans show files or bytes read and pruned; joins reveal strategies and rows; Later nodes show aggregation, sort, or writing. Execution Details distinguishes task time in Photon. The query history provides statement_id, status, times and compute to connect an execution to the profile. Valid comparison uses the same result, parameters, cache state, and concurrency, because a repeated query can benefit from data already available.",
        "Reducing queue time involves capacity, autoscaling or demand management; reducing compilation requires more manageable plans; reducing execution requires less data, better layout or operators. A join that multiplies rows can make the final sort appear dominant, but the cause is cardinality. Input and output rows are traversed, the first abnormal jump is identified, and key semantics are validated. Optimization is confirmed with P50 and P95, bytes read, pruning, cost and Photon percentage, not with an isolated capture."
      ],
      "concepts": [
        {
          "term": "Queue time",
          "definition": "Interval in which a query waits for capacity before beginning its execution.",
          "whyItMatters": "It is fixed with concurrency and capacity, not necessarily by changing the SQL."
        },
        {
          "term": "Cardinality explosion",
          "definition": "Unexpected increase in rows caused by non-unique joins, explode or other multiplicative operation.",
          "whyItMatters": "It makes all subsequent operators expensive and may point to a semantics error."
        },
        {
          "term": "Statement ID",
          "definition": "Unique identifier of a statement execution in the query history.",
          "whyItMatters": "It unites evidence of system tables, interface, alerts and reproducible diagnostics."
        }
      ],
      "workedScenario": {
        "situation": "A dashboard takes 48 seconds during rush hour and 9 seconds outside of it. The final sort is listed as the slower operator and is proposed to rewrite ORDER BY.",
        "reasoning": [
          "Separate queue from execution by statement_id and verify that 23 seconds are queue, while the plan also multiplies rows in a join of non-unique dimensions.",
          "Correct the uniqueness of the dimension and adjust capacity or autoscaling for the peak, treating the two observed causes separately.",
          "Compare P95, rows after join, bytes, queue and cost during the same time pattern, validating that the order of results remains correct."
        ],
        "outcome": "The consultation takes 6 seconds P95; The analysis avoids a cosmetic optimization of the sort and resolves both cardinality and concurrency."
      }
    },
    "keyPoints": [
      "Wall-clock and aggregate task time measure different phenomena.",
      "Top operators and DAG locate the dominant operator.",
      "Pruning and I/O validate layout better than a sense of speed."
    ],
    "decisions": [
      "Wall-clock and aggregate task time measure different phenomena.",
      "Top operators and DAG locate the dominant operator.",
      "Pruning and I/O validate layout better than a sense of speed."
    ],
    "example": {
      "title": "Labeled query to compare profiles",
      "note": "Saves statement ID, variant and data window; compare the same metrics and concurrency."
    },
    "pitfalls": [
      "Interpret aggregate task time as duration perceived by the user.",
      "Optimize the most attractive operator without checking if it is on the critical path."
    ],
    "examDecision": "For SQL warehouse or serverless, use Query Profile; identifies the top operator and validates the change with I/O, pruning and wall-clock.",
    "checkpoint": {
      "question": "Why can task time exceed wall-clock?",
      "answer": "Because it adds the time of tasks executed in parallel on different cores, while wall-clock measures elapsed time."
    }
  },
  "m26-l3": {
    "summary": "Converts system tables into a common timeline for queries, jobs, compute, and cost at account and region scale.",
    "explanation": [
      "`system.query.history` records SQL warehouse and serverless statements with state, duration, compute, and metrics. `system.lakeflow.job_run_timeline` and `job_task_run_timeline` allow you to analyze job runs and tasks; `system.billing.usage` provides consumption. These tables are largely regional, have documented retentions, and are governed by Unity Catalog.",
      "Build restricted views for computers instead of granting broad access to the `system` catalog. Joins using available job/run/statement IDs and preserves time ranges; don't force joins when the source doesn't emit a common identifier. A reliable timeline differentiates compute failure, queuing, slow execution, and subsequent retry."
    ],
    "deepDive": {
      "mentalModel": "The system tables are the historical observability plan of the account. Each schema records a perspective: billing describes consumption, query history statements, lakeflow jobs and tasks, compute configurations, access auditing, and lineage inferred relationships. No single table tells the entire incident. The conceptual work is to build a timeline with compatible identifiers, region, and granularity, and accept that some relationships are optional or partial. It is sensitive data governed within the catalog system, with its own retention and availability. A selective query by time and workspace protects performance; Copying everything off the platform increases the risk surface and is usually unnecessary.",
      "mechanics": [
        "Tables are enabled and queried using Unity Catalog; USE CATALOG, USE SCHEMA, and SELECT permissions control access. billing.usage is global, while several operational and audit tables are regional; the joins must respect that difference. query.history includes SQL warehouse and serverless, and lakeflow exposes definitions and run timelines. Clusters acts as slowly changing dimension. The workspace, job, run, task, statement, or cluster IDs serve as bridges, but the available metadata varies by product and date.",
        "Lineage is inferred and does not guarantee a record for every operation; audit describes control and access events, not performance; billing may come with corrections. Raw facts are preserved, then curated views are constructed with cues, temporal windows, and known quality. Queries must filter by date and region to avoid volume limits. Retention, currently typically one year for many tables, is not a substitute for your own policy when longer analysis is required. Access to the dashboard must mask identities according to audience."
      ],
      "concepts": [
        {
          "term": "Granularity",
          "definition": "The unit that represents each row, such as time zone, statement, task, event, or lineage relationship.",
          "whyItMatters": "Joining incompatible grains without aggregation duplicates metrics and produces false conclusions."
        },
        {
          "term": "Regional scope",
          "definition": "Coverage limited to events or resources in a region, as opposed to global account tables.",
          "whyItMatters": "Explains absences and forces regions to be consulted or consolidated explicitly."
        },
        {
          "term": "Slowly changing dimension",
          "definition": "Version history of an entity's attributes over time.",
          "whyItMatters": "Allows you to associate a run with the compute configuration in effect at the time, not with the current one."
        }
      ],
      "workedScenario": {
        "situation": "The cost of a workspace rises at dawn and you have to know what change in job, consultation and identity occurred three weeks ago.",
        "reasoning": [
          "Filter billing by workspace, time and SKU, net corrections and extract resource metadata before joining to any timeline.",
          "Relate IDs to Lakeflow runs, query history and historical compute configuration, preserving grains to avoid duplicating the amount.",
          "Consult audit and lineage around the deployment to identify affected actors and tables, marking gaps where inference does not provide evidence."
        ],
        "outcome": "The timeline attributes the increase to a backfill deployed by a service principal and shows which tables it touched, how much it cost, and when it was removed."
      }
    },
    "keyPoints": [
      "Respects regional scope and retention of each system table.",
      "Grant `USE` and `SELECT` through least privilege views.",
      "Correlates by IDs and time, declaring lag and telemetry gaps."
    ],
    "decisions": [
      "Respects regional scope and retention of each system table.",
      "Grant `USE` and `SELECT` through least privilege views.",
      "Correlates by IDs and time, declaring lag and telemetry gaps."
    ],
    "example": {
      "title": "Detect failed and slow queries",
      "note": "Display this information using a view that filters workspaces or teams; Messages may contain sensitive details."
    },
    "pitfalls": [
      "Assume that a query from another region will appear in the queried metastore.",
      "Give broad `SELECT` on audit and query history to the entire workspace."
    ],
    "examDecision": "Use system tables for trends and account correlation; use the run profile/UI for specific details.",
    "checkpoint": {
      "question": "Why is a dynamic view preferable to directly sharing `system.query.history`?",
      "answer": "Allows you to limit rows and columns per team or workspace and avoid exposing unnecessary text, errors, and identities."
    }
  },
  "m26-l4": {
    "summary": "Choose event logs, driver logs or executor logs depending on the failure and understand how access mode and retention limit the investigation.",
    "explanation": [
      "The compute event log explains creation, changes, escalation, and termination. Driver stdout/stderr/log4j contains scheduling and application exceptions; worker/executor logs help when a specific task fails. Spark UI preserves details of the active runtime, but restarting compute may lose the historical view; configures log delivery when the support policy requires external retention.",
      "Access depends on compute mode. In general, users do not see all executor logs and only admins access certain driver logs; in dedicated, the assigned principal gets more visibility. Do not register payloads, secrets, or tokens to facilitate debugging. Use correlation IDs and structured metrics that allow you to match the failure with job/run without exposing data."
    ],
    "deepDive": {
      "mentalModel": "The logs are chosen by failure boundary. The Spark event log describes structured application events and allows you to reconstruct jobs, stages, and executors; the driver log contains coordination, stack traces of the main process and user exit; The executor log contains failures within distributed tasks and processes. Looking at the wrong file produces silence or noise. Access mode determines who can view logs and local retention can end when you close compute, so critical incidents require governed delivery. A log is not an innocuous source: it can include routes, parameters, queries or data, so permissions and redaction are part of observability.",
      "mechanics": [
        "The driver creates the SparkContext, builds plans and coordinates tasks; errors before distributing work or a failed collect appear there. The executors execute partitions, so that an exception only for certain data is repeated in their logs and is correlated with task attempt. The Spark event log serializes events to rebuild the UI after execution. Lakeflow pipeline event logs are another pipeline-specific tabular source, not to be confused with process logs. The delivery configuration and ACL is decided before the incident.",
        "More logging can expose data and increase volume; less logging can prevent RCA. Levels are defined by environment, secret writing, location with retention, and access groups. During diagnostics, timestamp, run, application, stage and task are used to trim the interval, instead of downloading everything. An executor exception can be the effect of corrupt data, memory, or library; stack trace and partition is preserved before retrying. Material evidence is linked to the incident with a hash or audited path."
      ],
      "concepts": [
        {
          "term": "Spark event log",
          "definition": "Structured sequence of events of an application used to reconstruct its execution and Spark UI.",
          "whyItMatters": "Allows subsequent analysis even if the compute no longer exists, if appropriate persistence has been configured."
        },
        {
          "term": "Driver log",
          "definition": "Output and errors of the process that plans, coordinates, and executes local code of the application.",
          "whyItMatters": "It is the source for initialization, scheduling, driver library, and result collection failures."
        },
        {
          "term": "Executor log",
          "definition": "Exit and exceptions of processes that execute tasks on distributed partitions.",
          "whyItMatters": "Locates data, memory, or environment-dependent errors that only occur in certain workers."
        }
      ],
      "workedScenario": {
        "situation": "A job fails one in twenty times with Python worker exited unexpectedly; the driver only shows that a stage aborted after four retries.",
        "reasoning": [
          "Use the driver's stage and task attempts to locate the exact executor logs and check if the same partition and stack trace reappear.",
          "Preserve event log and minimal sample of problematic input in a governed location, redacting sensitive values before sharing evidence.",
          "Play on that partition, correct the dependency or data, and verify that new runs do not generate equivalent attempts or errors."
        ],
        "outcome": "An absent native library is discovered only in executors; The dependency is packaged correctly and the event log confirms stability during the spike."
      }
    },
    "keyPoints": [
      "Event log describes life cycle; driver logs, application; executor logs, specific tasks.",
      "Plan retention before the incident.",
      "The access mode determines who can investigate each signal."
    ],
    "decisions": [
      "Event log describes life cycle; driver logs, application; executor logs, specific tasks.",
      "Plan retention before the incident.",
      "The access mode determines who can investigate each signal."
    ],
    "example": {
      "title": "Structured logging without business data",
      "note": "Avoid printing entire failed logs; Store sensitive samples only in a governed quarantine."
    },
    "pitfalls": [
      "Restart compute before capturing evidence that does not have persistent delivery.",
      "Add `print(df.collect())` and filter personal data to operational logs."
    ],
    "examDecision": "Choose the signal closest to the failed layer and preserve evidence before repairing; do not expand log permissions unnecessarily.",
    "checkpoint": {
      "question": "The compute failed to start the application. What would you check before the executor logs?",
      "answer": "The compute event log and the driver/init-script logs, because perhaps there were never useful executors for the task."
    }
  },
  "m26-l5": {
    "summary": "Automate minimal capture with CLI and APIs, maintaining secure authentication, pagination, and traceability of each artifact.",
    "explanation": [
      "The CLI offers `jobs get-run`, `get-run-output`, `list-runs`, and `repair-run` commands; The `api` group is for endpoints not yet wrapped. An incident capture should preserve run ID, status, timestamps, effective configuration, and links to profiles, not run repairs in the same step. Use OAuth for automation and separate profiles, never tokens stuck in scripts or notebooks.",
      "Responses can be paged and some task outputs have limits. Design the script as idempotent read, store JSON on a retention-governed volume, and redact sensitive fields. After formulating a hypothesis, the repair becomes an approved action with before/after evidence."
    ],
    "deepDive": {
      "mentalModel": "An automated diagnostic capture should be a minimal black box, not an indiscriminate copy of the account. Starting from an incident ID and a range, it obtains reproducible metadata using CLI or REST, follows pagination, and records which request produced each artifact. Authentication represents a service identity with least privilege; the token is never printed or stored with the evidence. APIs are eventually consistent, versioned and subject to limits, so retries with backoff and page markers are part of the mechanism. The goal is to preserve enough context to reconstruct the cause without unnecessarily expanding the exposure of queries, users, or data.",
      "mechanics": [
        "The Databricks CLI uses APIs and authentication profiles to list and obtain jobs, runs, compute, or other resources. REST collections return pages with continuation tokens or indicators; ignoring them produces a truncated sample that appears complete. The capture stores UTC timestamp, workspace, logical endpoint, non-secret parameters, response code, and client version. For transient calls, bounded retries and jitter are applied, but a 403 is not resolved by retrying: it indicates incorrect permission or scope.",
        "An overly privileged principal makes capture easier, but makes the package risky. Read only necessary resources and system tables are granted, the destination is encrypted, and retention is applied. Payloads are filtered to exclude tokens, sensitive parameters, and notebook bodies if they are not essential. Each file has a checksum and manifest; Thus the research distinguishes original data from annotations. Automation is tested regularly, because discovering broken pagination during an incident eliminates just the necessary historical evidence."
      ],
      "concepts": [
        {
          "term": "Pagination",
          "definition": "Splitting an API collection into responses linked using tokens, offsets, or continuation flags.",
          "whyItMatters": "Not going through all the pages creates incomplete diagnoses and skews counts or timelines."
        },
        {
          "term": "Backoff with jitter",
          "definition": "Increasing and slightly random wait before repeating transient errors.",
          "whyItMatters": "Reduces pressure on the service and prevents multiple clients from retrying simultaneously."
        },
        {
          "term": "Evidence Manifesto",
          "definition": "Index that records origin, time, parameters and checksum of each captured artifact.",
          "whyItMatters": "It provides traceability and integrity without relying on informal file names."
        }
      ],
      "workedScenario": {
        "situation": "After an incident it is discovered that the script saved only the first 25 runs, printed the token in a CI log and omitted the configuration of the current job.",
        "reasoning": [
          "Revoke the exposed credential and define a minimal read principal, encrypted storage, and a secret-free manifest.",
          "Implement page traversal, retries only for transient failures and capture of job settings, run output and log references within the interval.",
          "Test against more than one hundred runs and simulate 429, 403 responses and empty pages, verifying counts, checksums and absence of secrets."
        ],
        "outcome": "The new black box preserves complete, auditable evidence in minutes, with minimal permissions and an automatic test that detects truncation or leakage."
      }
    },
    "keyPoints": [
      "Separates read-only capture from repair actions.",
      "Use OAuth/main service and environment profiles.",
      "Manage pagination, limits and redaction of sensitive data."
    ],
    "decisions": [
      "Separates read-only capture from repair actions.",
      "Use OAuth/main service and environment profiles.",
      "Manage pagination, limits and redaction of sensitive data."
    ],
    "example": {
      "title": "Read-only capture of a run",
      "note": "Save files to a governed destination and apply redaction if the output contains sensitive parameters."
    },
    "pitfalls": [
      "Run `repair-run` automatically when detecting any failure and erase causal evidence.",
      "Save a PAT next to the diagnostic script or in the shell history."
    ],
    "examDecision": "Automate inventory and capture with CLI/API; leave repair/cancel as a controlled phase after diagnosis.",
    "checkpoint": {
      "question": "Why separate capture from `repair-run`?",
      "answer": "To preserve the causal state, avoid premature mutations and allow a reviewable repair decision."
    }
  },
  "m27-l1": {
    "summary": "Manage an incident with explicit severity, roles, timeline, and success criteria before touching configuration.",
    "explanation": [
      "A data incident combines technical and business impact: delay, incorrect data, duplicates, unavailability or cost overruns. Declare severity and scope, assign incident commander and communication, freeze non-essential changes, and establish a timeline in UTC with job, run, statement, and commit IDs. The first goal is to contain impact without destroying evidence.",
      "Difference root cause mitigation. Reprocessing a partition can restore the SLA, but does not explain why it failed; expanding compute can save time, but increases cost and hides skew. Define quantified recovery criteria—freshness, completeness, duration, cost—and a rollback before executing any changes."
    ],
    "deepDive": {
      "mentalModel": "An incident is a system of decisions under uncertainty. Before optimizing Spark or changing compute, the team needs a common picture: impact, severity, affected service, likely startup, owner, and recovery condition. The incident commander coordinates and protects the timeline; those who investigate test hypotheses; whoever communicates keeps consumers informed. Separating functions reduces simultaneous changes and conflicting memory. The immediate goal is not to find the perfect explanation, but to restore service with reversible mitigation and sufficient evidence. Each action must declare hypothesis, risk, expected signal and rollback. Without that discipline, increasing resources can hide the cause, increase costs and destroy the comparison necessary for subsequent analysis.",
      "mechanics": [
        "Severity is derived from impact and urgency, not how impressive a stack trace looks. The timeline records detection, recent changes, symptoms, decisions, commands or runs and results in UTC. The incident commander assigns a single owner to each front, limits the number of changes and decides when to escalate. Success criteria are observable: backlog under a certain value, data published up to a timestamp, P95 within the SLO, and successful validations. A central channel and document prevent critical context from being dispersed.",
        "Mitigating can mean stopping a producer, isolating a partition, repairing a run, or temporarily escalating, but each option alters risk and evidence. A reversible change is applied one at a time and is evaluated over an agreed window. If the problem affects integrity, recovering latency without validating data does not close the incident. When going from response to recovery, the timeline freezes, backfills are assigned and communication is maintained until all criteria are met, not just until the dashboard turns green."
      ],
      "concepts": [
        {
          "term": "incident commander",
          "definition": "Unique role that coordinates priorities, responsible parties, decisions and communication during the response, without needing to personally execute each technical investigation.",
          "whyItMatters": "Avoid conflicting orders, simultaneous changes, and loss of a common view of impact and recovery."
        },
        {
          "term": "Reversible mitigation",
          "definition": "Temporary change whose effect can be quickly undone if it does not improve signals or introduce a new risk.",
          "whyItMatters": "It allows you to recover service with uncertainty without turning an urgent reaction into debt or permanent damage."
        },
        {
          "term": "Recovery criterion",
          "definition": "Measurable condition that combines availability, latency, integrity, and freshness to declare the affected service restored.",
          "whyItMatters": "Prevents closing when only the visible error disappears but late, incorrect data or broken consumers remain."
        }
      ],
      "workedScenario": {
        "situation": "At 07:10, the settlement pipeline does not publish the 06:00 gold table; six countries are waiting for the data, there are two recent changes and the team simultaneously proposes restarting, scaling and restoring the table.",
        "reasoning": [
          "Declare high severity, appoint commander and those responsible for data, platform and communication, and set as a success full publication until 06:00 with approved financial reconciliation.",
          "Freeze non-essential changes, build a timeline with deployments and runs, and first choose reversible mitigation that preserves checkpoints and evidence of the failure.",
          "Validate counts, amounts and freshness after recovery, communicate regular intervals and postpone any permanent tuning until a proven cause is available."
        ],
        "outcome": "The service is recovered in forty minutes without duplicate settlements; The team retains sufficient evidence to attribute the regression to a specific change and avoids three incompatible actions."
      }
    },
    "keyPoints": [
      "Prioritize impact and data security over elegant optimization.",
      "Record each hypothesis, action, result and identifier.",
      "Separates immediate mitigation from permanent correction."
    ],
    "decisions": [
      "Prioritize impact and data security over elegant optimization.",
      "Record each hypothesis, action, result and identifier.",
      "Separates immediate mitigation from permanent correction."
    ],
    "example": {
      "title": "Header of an incident file",
      "note": "The file is operational: it avoids client names and links governed evidence instead of pasting sensitive data."
    },
    "pitfalls": [
      "Change several settings at once and lose causal attribution.",
      "Declare resolved upon completion of the job without validating quality and downstream consumers."
    ],
    "examDecision": "Contain, preserve evidence and define measurable recovery; Permanent optimization comes after restoring secure service.",
    "checkpoint": {
      "question": "What differentiates a mitigation from a root cause?",
      "answer": "Mitigation reduces impact now; The root cause explains the mechanism that caused the failure and prevents recurrence."
    }
  },
  "m27-l2": {
    "summary": "Triangulates performance with three layers: plan and data, execution resources, and service demand/concurrency.",
    "explanation": [
      "A regression can come from code change, data growth or distribution, statistics/layout, compute, or concurrency. Compare the last healthy run with the first degraded one using the same window: plan, top operator, bytes read, shuffle, spill, workers and queue. A bundle or table history diff bounds changes without speculation.",
      "Formulates falsifiable hypotheses: 'null key generates skew' is tested with distribution and tasks; 'the warehouse is saturated' with queue and concurrency; 'statistics missing' with pruning and plan. Prioritize the cheap and reversible test that most reduces uncertainty. Do not resize until you know if the stage can use additional capacity."
    ],
    "deepDive": {
      "mentalModel": "The perceived performance is the three-layer composition. The plan and data layer decides how much work exists: scans, cardinality, shuffles, skew and layout. The resource layer decides how fast it runs: CPU, memory, I/O, network, spills and faults. The service layer decides when it can start and how much it competes: queuing, concurrency, autoscaling, and outer limits. An isolated metric belongs to only one layer. High CPU does not demonstrate inefficient code; high tail is not fixed with liquid clustering; Low read bytes do not exclude an explosive join. Triangulating means formulating a hypothesis that predicts coherent signals in all three layers and discarding it if one of them contradicts the story.",
      "mechanics": [
        "The plan and Query Profile reveal operators, rows, bytes, pruning and strategy; Spark UI provides distribution by tasks, shuffle, spill and executors; system tables and endpoint metrics provide concurrency, queue and cost timelines. Everything is aligned by run or statement ID and timestamps, avoiding comparing averages from different windows. The first skip of rows or bytes usually locates the upstream cause, while the slowest operator may just be the one receiving the excess. The critical path determines which signal can explain the SLA.",
        "The diagnosis uses experiments that separate layers: running the same input in a non-concurrency window tests demand; preserve capacity and change layout test data; resize with the same plan test resources. Caches, autoscaling, and volume must be controlled for the comparison to be valid. Increasing compute can be a legitimate mitigation, but it is marked as temporary until it is demonstrated that the load needs capacity and not that a cardinality change multiplied avoidable work."
      ],
      "concepts": [
        {
          "term": "Triangulation",
          "definition": "A method that combines independent evidence from plan, resources, and demand to accept or refute a causal explanation of performance.",
          "whyItMatters": "Reduce diagnostics based on partial correlations and direct mitigation to the layer that actually limits the SLA."
        },
        {
          "term": "Upstream signal",
          "definition": "Metric produced before the slow operator that explains why the slow operator received more work, such as a cardinality burst.",
          "whyItMatters": "Correcting the early cause avoids repeatedly optimizing later operators that only process the generated excess."
        },
        {
          "term": "Controlled experiment",
          "definition": "Comparison that modifies a single relevant lever while keeping input, outcome, and remaining conditions sufficiently equivalent.",
          "whyItMatters": "It allows attributing an improvement to the action taken and not to cache, demand or volume variation."
        }
      ],
      "workedScenario": {
        "situation": "A dashboard goes from eight to sixty seconds. The warehouse reaches the maximum size, but Query Profile shows that a recent join multiplies the rows by twelve and the queue begins after the deployment.",
        "reasoning": [
          "Align statement IDs, deployment and concurrency to verify that row explosion lengthens each query and, as a side effect, saturates capacity and creates a queue.",
          "Correct the many-to-many relationship using a single dimension, validate semantics and run with the same size and peak of users before expanding warehouse.",
          "Compare rows, execution time, queue time, P95 and cost, removing temporal scaling only when the base capacity absorbs the validated demand."
        ],
        "outcome": "Cardinality returns to the contract, the queue disappears and P95 remains at nine seconds; the organization avoids duplicating capacity to compensate for a logical defect."
      }
    },
    "keyPoints": [
      "Compare a healthy run and a degraded run with controlled volume.",
      "Distinguishes plan/data, resources and concurrency.",
      "Test one hypothesis at a time with acceptance metrics."
    ],
    "decisions": [
      "Compare a healthy run and a degraded run with controlled volume.",
      "Distinguishes plan/data, resources and concurrency.",
      "Test one hypothesis at a time with acceptance metrics."
    ],
    "example": {
      "title": "Baseline of queries by p95 and read data",
      "note": "Adjust metric names to the scheme available in your region; retains statement IDs to open the specific profile."
    },
    "pitfalls": [
      "Compare runs with different data or cache windows.",
      "Treat temporal correlation between two events as a proven cause."
    ],
    "examDecision": "Before climbing, locate if the time is queued, scan, shuffle, spill or an extreme task and change the corresponding lever.",
    "checkpoint": {
      "question": "What evidence would refute the lack of global capacity hypothesis?",
      "answer": "Mostly idle workers and a single dominant task show that more parallel capacity would not be used."
    }
  },
  "m27-l3": {
    "summary": "Recover reliability by respecting idempotence, checkpoints, Delta contracts and exact backfill limits.",
    "explanation": [
      "Before retrying, determine the partial effect: what Delta commits exist, what task failed, and whether the external sink received operations. A `MERGE` with a stable key can be repeated; an append without deduplication can duplicate. In streaming, clearing a checkpoint changes progress and state and is rarely a safe fix. Use repair run for failed tasks when their dependencies and outputs are reusable.",
      "A backfill must declare range, code version, destination table, overwrite/merge strategy and validations. Isolates the live ingestion process to avoid races and maintains a batch control table. Recovery ends when you reconcile counts, unique keys, freshness and consumers, not just when the run appears green."
    ],
    "deepDive": {
      "mentalModel": "Recovering reliability means resuming from a known boundary without losing or duplicating effects. In Delta, a transaction makes a write atomic, but it does not make an entire pipeline idempotent: external calls, multiple tables, or poor business keys can repeat results. In streaming, the checkpoint links source, state, and configuration progress; Deleting it is equivalent to forgetting what was processed and requires an explicit plan. A backfill is a new execution over a delimited interval, not an excuse to reread the entire history. The secure design defines keys, deduplication, merge condition, code version, input snapshot, order with the active stream and reconciliation tests before publishing.",
      "mechanics": [
        "A checkpoint preserves offsets and state so that Structured Streaming picks up consistently; changing source, state or certain options may be incompatible with that directory. Delta guarantees atomic commits and optimistic control, but a non-idempotent logic retry can write another valid row. MERGE needs a key that identifies the business effect and a deterministic rule for repeated changes. In Jobs, repair run reuses successful results and executes failed or dependent tasks depending on the graph, reducing surface area versus relaunching everything.",
        "For backfill, the semi-open interval, time zone, code version and destination table or MERGE predicate are set. If the stream is still active, both writers must coordinate using keys and idempotence or use a controlled staging and swap table. Not only count is validated: duplicate keys, sums, time limits, CDF and consumers. Restoring a table can introduce changes that downstream streams interpret as new; the runbook should consider the chain, not just the repaired object."
      ],
      "concepts": [
        {
          "term": "Idempotence",
          "definition": "Property whereby repeating an operation with the same input produces the same observable state without additional effects.",
          "whyItMatters": "Allows safe retries and backfills when partial failures make it uncertain which part ever completed."
        },
        {
          "term": "Recovery frontier",
          "definition": "Verifiable point for offsets, version, timestamp or commit from which processing can be resumed consistently.",
          "whyItMatters": "Avoid arbitrary restarts that create gaps, duplicates or mix code and input from different periods."
        },
        {
          "term": "Repair run",
          "definition": "Selective re-execution of failed and dependent tasks within a run, preserving valid results when the graph allows it.",
          "whyItMatters": "Reduces time, cost and risk compared to repeating a complete workflow that is already partially correct."
        }
      ],
      "workedScenario": {
        "situation": "A payment stream stopped for three hours after writing silver but before updating a gold table and notifying an external system; It is not clear what notifications went out.",
        "reasoning": [
          "Preserve checkpoint and commits, inventory effects by payment_id, and separate the Delta transaction from the external call, which requires its own idempotent record.",
          "Repair gold using MERGE with payment_id and exact window, and forward only unacknowledged notifications using a governed outbox.",
          "Resume the stream from its checkpoint, reconcile bronze-silver-gold-outbox and watch for duplicates and backlog before closing recovery."
        ],
        "outcome": "The three hours are recovered without duplicate charges or messages; The outbox converts future retries into provably idempotent and auditable operations."
      }
    },
    "keyPoints": [
      "Inspect commits and external effects before retrying.",
      "Do not delete checkpoints to resolve a code or quality bug.",
      "Delimit and validate each backfill with a batch key."
    ],
    "decisions": [
      "Inspect commits and external effects before retrying.",
      "Do not delete checkpoints to resolve a code or quality bug.",
      "Delimit and validate each backfill with a batch key."
    ],
    "example": {
      "title": "idempotent MERGE for a backfill range",
      "note": "The second query is minimal evidence; adds reconciliation of amounts and time range according to the contract."
    },
    "pitfalls": [
      "Delete checkpoint and reprocess the entire source without knowing retention or idempotence.",
      "Run backfill and live pipeline on the same range without coordination."
    ],
    "examDecision": "Repairs only failed tasks when previous outputs are valid; uses bounded and idempotent backfill when historical data must be recalculated.",
    "checkpoint": {
      "question": "Why doesn't a green run after a retry show complete recovery?",
      "answer": "There may be duplicates, partial effects or data outside of SLA; contracts and downstream consumers must be validated."
    }
  },
  "m27-l4": {
    "summary": "Control incident spending without sacrificing evidence or turning a temporary compute increase into permanent debt.",
    "explanation": [
      "During an incident it may be rational to temporarily increase capacity to restore an SLA, but record who approved it, maximum duration, and automatic rollback. `system.billing.usage` allows you to attribute the run and compare cost per run. A repair that reduces runtime but doubles cost is not an improvement unless the avoided impact justifies this compensation.",
      "After stabilizing, it removes temporary resources, restores policy limits, and calculates retry, backfill, and maintenance costs. Distinguishes cost caused by the incident from the baseline. The budgets warn; They are not a substitute for operational concurrency control, autotermination, and appropriate serverless modes."
    ],
    "deepDive": {
      "mentalModel": "During an incident, cost is a constraint and a signal, not the main objective. Temporarily escalating may be the cheapest decision if it reduces a costly outage, but it must have expiration, ownership, and withdrawal criteria. Trimming compute while collecting evidence can prolong the failure or delete logs; leaving it extended indefinitely turns mitigation into a new baseline. The analysis links incremental cost with recovery time, backlog, integrity risk and service value. It also distinguishes useful compute from failed retries, repeated scans, and overlapping backfills. Incident FinOps discipline is about conscious spending to recover and then return to a measured configuration, not about blocking urgent actions by hourly budget.",
      "mechanics": [
        "A previous baseline is established with billing and workload metrics, then the incident period and capacity changes are tagged or recorded. Each mitigation estimates cost per hour, maximum duration and output signal. Usage and timelines allow you to separate the extended resource from retries and normal jobs. A budget limit may alert you, but it should not automatically cancel a repair that protects integrity without understanding dependencies. The commander approves extraordinary escalations and FinOps documents the impact afterwards.",
        "Withdrawal requires demonstrating that the permanent neck has been resolved or that the base demand justifies capacity. If the team optimized code, repeat with previous size and compare SLA; if only backlog was drained, it gradually returns to normal mode. Workers, accelerated modes and temporarily coded emergency schedules are eliminated. The postmortem expresses cost of the incident, cost of mitigation and cost avoided, signaling uncertainty. This avoids celebrating savings that prolonged unavailability or hiding expenses under a permanent configuration."
      ],
      "concepts": [
        {
          "term": "incremental cost",
          "definition": "Difference in expense attributable to the incident and its mitigations with respect to a comparable baseline of normal operation.",
          "whyItMatters": "It allows you to evaluate urgent decisions without confusing ordinary growth with computing, retries or extraordinary backfills."
        },
        {
          "term": "Operational expiration",
          "definition": "Date, condition or automation that requires reviewing and removing a temporary emergency configuration.",
          "whyItMatters": "It prevents a useful escalation during the crisis from remaining indefinitely as unexamined spending and debt."
        },
        {
          "term": "Avoided cost",
          "definition": "Estimation of the business impact or risk that did not occur thanks to sufficiently fast and safe mitigation.",
          "whyItMatters": "Give context to the additional expense and avoid optimizing just the bill while increasing service loss."
        }
      ],
      "workedScenario": {
        "situation": "A regulatory pipeline accumulates eight hours of backlog. High-performance mode costs an additional 900 euros per hour, but every hour of delay exposes a penalty and blocks downstream operations.",
        "reasoning": [
          "Calculate necessary capacity to drain backlog, maximum cost of the window and exit criterion, comparing it with the impact and risk of maintaining the delay.",
          "Authorize temporary mode, preserve observability and avoid duplicate backfills, recording start, owner and automatic alert when reaching the target backlog.",
          "Return to base configuration, verify stable SLA and analyze the cause to decide if a code improvement avoids repeating the extraordinary expense."
        ],
        "outcome": "The backlog is drained in ninety minutes with a limited cost much lower than the avoided impact; The extra capacity is removed automatically and does not contaminate the monthly budget."
      }
    },
    "keyPoints": [
      "All emergency escalations require expiration and rollback.",
      "Compare cost per run and SLA compliance.",
      "Includes retries and backfills in the total cost of the incident."
    ],
    "decisions": [
      "All emergency escalations require expiration and rollback.",
      "Compare cost per run and SLA compliance.",
      "Includes retries and backfills in the total cost of the incident."
    ],
    "example": {
      "title": "Consumption associated with a job during the incident",
      "note": "Match prices to currency and compare with equivalent healthy days; retains usage corrections."
    },
    "pitfalls": [
      "Leaving an oversized warehouse or cluster after mitigation.",
      "Skip the cost of retries and backfills when evaluating the solution."
    ],
    "examDecision": "Accept temporary capacity if you restore a critical SLA with rollback; for the final solution requires performance, reliability and cost measured together.",
    "checkpoint": {
      "question": "What two minimum pieces of information accompany an emergency escalation?",
      "answer": "An expiration/rollback criterion and an impact metric that justifies the additional cost."
    }
  },
  "m27-l5": {
    "summary": "Close with a no-fault postmortem that transforms the technical cause into verifiable controls, evidence, and observability.",
    "explanation": [
      "The postmortem reconstructs impact, detection, timeline, root cause and contributing factors with evidence. Avoid 'human error' as a final cause: ask what guardrail, test or design allowed a normal action to cause harm. Separates corrective actions to prevent, detect, mitigate and learn, with owner and date.",
      "Each action must have a closing condition. 'Improve monitoring' does not work; 'alert if p95 exceeds 24 min for two runs and link the Query Profile' yes. Update runbooks, add a regression test with representative distribution and validate the fix under load. Share learning without including sensitive incident data."
    ],
    "deepDive": {
      "mentalModel": "A useful postmortem explains how the system allowed the incident, not who made the ultimate mistake. The root cause is rarely one person or a single line: it includes technical conditions, missing signals, controls that did not work, and reasonable decisions with incomplete information. The document separates timeline facts, confirmed hypotheses, contributing factors and impact. Each action must change a verifiable property of the system and have owner, priority, date and evidence of closure. Adding monitoring isn't enough if no one knows what threshold represents damage or what runbook to run. The review ends when the learnings are converted into tests, guardrails, observability or design, not when an elegant narrative is published.",
      "mechanics": [
        "The timeline is reconstructed with logs, commits, runs and communications, distinguishing when it occurred, was detected, understood and mitigated. Five whys can help, but it stops at actionable controls, not accusations. What went well and what increased recovery time is documented. Actions are classified by prevention, detection, mitigation and recovery; each defines an observable test, such as a test that fails with regression or an alert that fires before violating SLO.",
        "Vague actions such as improving monitoring or being more careful cannot be closed objectively. A large backlog of unprioritized tasks also does not reduce risk. A few high-leverage measures are chosen, linked to traceable work, and then their effectiveness is reviewed. If the temporary mitigation is still active, it appears as an urgent action with an expiration. The postmortem shares enough detail to show patterns, but it redacts sensitive data and doesn't turn credentials, private queries, or individual names into broad material."
      ],
      "concepts": [
        {
          "term": "Contributing factor",
          "definition": "Technical or organizational condition that increased the probability, impact or time of recovery without being a sufficient cause in itself.",
          "whyItMatters": "It allows you to correct several weak defenses instead of looking for a single simplistic explanation or a guilty person."
        },
        {
          "term": "Verifiable action",
          "definition": "Corrective task with person responsible, date and concrete evidence that demonstrates that the behavior of the system changed.",
          "whyItMatters": "Transform learning into risk reduction and avoid making vague promises without verifying their effectiveness."
        },
        {
          "term": "Detection time",
          "definition": "Interval between the start of the impact and the moment when an actionable signal reaches the responsible team.",
          "whyItMatters": "It shows whether observability and ownership allowed us to react before the damage grew significantly."
        }
      ],
      "workedScenario": {
        "situation": "A schema change breaks a stream for six hours. The initial proposal blames whoever added the column, although there was no automated contract, representative staging or backlog alert for the product.",
        "reasoning": [
          "Reconstruct timeline and demonstrate that the evolution came without consumer proof, the backlog did not alert and the runbook suggested deleting checkpoint incorrectly.",
          "Define actions: contract test in CI, canary with real schema, delay alert and validated recovery runbook, each with owner and test.",
          "Remove personal language, review effectiveness at a game day and close only when the four pieces of evidence survive a compatible and incompatible change."
        ],
        "outcome": "The organization corrects systemic defenses instead of penalizing a valid delivery; the next incompatible change is blocked before production and generates a clear statement."
      }
    },
    "keyPoints": [
      "Describe mechanisms and conditions, not blame.",
      "Turn actions into verifiable results with ownership.",
      "Add a test that reproduces the causal pattern."
    ],
    "decisions": [
      "Describe mechanisms and conditions, not blame.",
      "Turn actions into verifiable results with ownership.",
      "Add a test that reproduces the causal pattern."
    ],
    "example": {
      "title": "Verifiable corrective actions",
      "note": "An action is closed with evidence; Don't mark completed just for creating a ticket."
    },
    "pitfalls": [
      "Use 'train the operator' as the only action in a system without guardrails.",
      "Close tasks by deployment without verifying that the flag changed."
    ],
    "examDecision": "Useful postmortem produces measurable controls and non-regression testing; a narrative without actions does not improve reliability.",
    "checkpoint": {
      "question": "What makes the 'add an alert' action verifiable?",
      "answer": "Define metric, threshold, window, owner, target, and a test that demonstrates that it triggers and leads to the correct runbook."
    }
  },
  "m28-l1": {
    "summary": "It separates business logic, Databricks adapters, and entry points so that the same code can be tested without running an entire notebook.",
    "explanation": [
      "A maintainable project places the importable package under `src/`, the tests under `tests/`, and leaves the notebooks as fine orchestrators. The logic that transforms DataFrames lives in functions with explicit inputs and outputs; Access to widgets, secrets, paths and writing is encapsulated in adapters. Thus, a change of notebook is not the only deployable or verifiable unit.",
      "`pyproject.toml` declares the package, Python version, dependencies and tools. The `src/` layout prevents accidentally importing code from the working directory instead of the installed artifact. In Databricks Runtime 16.0 or higher, a notebook should not be used as a Python module: it refactors shared code to `.py` files or a wheel."
    ],
    "deepDive": {
      "mentalModel": "A notebook is a work interface, not an architectural boundary. Business logic should live in pure functions and modules that receive DataFrames or values ​​and return results; adapters deal with spark.table, widgets, secrets, writing, and APIs; the entry point connects both. This separation creates seams where tests replace catalogs and services without simulating an entire workspace. It also makes dependencies explicit and avoids hidden state from cells executed out of order. A self-contained project retains thin notebooks for exploration or orchestration, but critical behavior is imported from a versioned package that can run locally, in CI, and in Jobs with the same code.",
      "mechanics": [
        "The domain layer operates on parameters and DataFrames passed by the caller; it doesn't get global SparkSession or read paths inside the function. A repository or adapter encapsulates Unity Catalog, JDBC, or REST and returns agreed types. The entrypoint parses configuration, creates dependencies, calls transformations, and publishes. Pyproject defines package and tests; Absolute imports avoid depending on the current directory. In modern runtime the CWD can be the file directory, but a remote job or wheel should not rely on the user's interactive layout.",
        "Too many layers for a small transformation add ceremony, but mixing I/O and rules makes each test slow and brittle. The boundary is chosen where there is a business decision or external dependency. SparkSession can be shared as a fixture in tests, while adapters are tested in integration. Notebooks do not contain copies of the code: they import a version and log commit or wheel. Refactoring preserves a characterization test on known data before moving features to avoid accidentally changing semantics."
      ],
      "concepts": [
        {
          "term": "Pure transformation function",
          "definition": "Function whose output depends only on explicit inputs and does not perform reads, writes or hidden access to external configuration.",
          "whyItMatters": "It can be tested with small data and reused in notebook, job or pipeline without preparing the entire environment."
        },
        {
          "term": "Adapter",
          "definition": "Component that translates between internal logic and a specific dependency such as Unity Catalog, REST, secrets or storage.",
          "whyItMatters": "Isolates platform changes and allows replacing dependency in unit tests without falsifying business rules."
        },
        {
          "term": "Entrypoint",
          "definition": "Execution point that loads configuration, creates dependencies and coordinates reading, transformation, validation and publication of the workload.",
          "whyItMatters": "Keeps orchestration visible and prevents imported modules from accidentally running side effects."
        }
      ],
      "workedScenario": {
        "situation": "A 1,400-line notebook reads eight tables, calls an API, transforms, and writes; Their tests run everything in a workspace for forty minutes and fail in cell order.",
        "reasoning": [
          "Characterize current outputs and extract deterministic rules to functions that accept DataFrames, leaving reads and writes behind explicit adapters.",
          "Create a minimum entrypoint and local fixtures for transformations; maintain an integration that exercises permissions, catalog and mock API in staging.",
          "Package the same version for notebook and Job, compare historical results and remove duplicate cells only after checking parity."
        ],
        "outcome": "Unit tests finish in seconds, integration preserves platform coverage, and code is no longer dependent on interactive state without disrupting production outputs."
      }
    },
    "keyPoints": [
      "Notebooks coordinate; Python modules implement reusable logic.",
      "Separates pure read, write, widget, and secret transformations.",
      "Use layout `src/` to test the package you actually distribute."
    ],
    "decisions": [
      "Notebooks coordinate; Python modules implement reusable logic.",
      "Separates pure read, write, widget, and secret transformations.",
      "Use layout `src/` to test the package you actually distribute."
    ],
    "example": {
      "title": "Importable transformation without global state",
      "note": "The function does not know catalog, widgets or writing mode; Those decisions belong to the entry point of the job."
    },
    "pitfalls": [
      "Encapsulate the entire pipeline in a notebook with global variables and implicit cell order.",
      "Import a notebook as a module when the modern runtime requires Python files for shared code."
    ],
    "examDecision": "Extract reusable logic into modules and keep notebooks thin; a production job must be able to install and test a versioned artifact.",
    "checkpoint": {
      "question": "Why shouldn't a transform function directly read `dbutils.widgets`?",
      "answer": "Because it attaches the logic to the notebook and makes testing difficult; The entry point must convert parameters and pass them to the function."
    }
  },
  "m28-l2": {
    "summary": "Design explicit DataFrame contracts so that tests detect schema changes, nulls, duplicates, and semantics, not just execution errors.",
    "explanation": [
      "Spark evaluates lazily, so constructing a DataFrame does not prove that the transformation is valid. The tests should materialize a small result and compare schema, rows and edge cases. Create minimal fixtures that include nulls, duplicates, timestamps and invalid values; avoid copying production datasets with sensitive information.",
      "A testable transformation takes DataFrames and ordinary parameters. To compare results, sort by deterministic keys or use DataFrames assertion utilities available in your stack; never depend on the natural order of partitions. Separates the technical contract—types and columns—from the business contract—for example, a single order per ID."
    ],
    "deepDive": {
      "mentalModel": "A DataFrame contract describes meaning in addition to columns. Includes names, types, nullability, keys, uniqueness, ranges, relationships, and temporal rules; It also clarifies which evolution is supported. A schema test detects that amount changed from decimal to string, but not that each order_id was duplicated or the return sign was reversed. Transformation tests should cover small examples representing equivalences, nulls, duplicates, late data, and limits. Comparing DataFrames requires normalizing order or using insensitive comparison when order is not part of the contract. The goal is not to replicate Spark with mocks, but to run Spark on precise cases and separate logic from quality invariants from production data.",
      "mechanics": [
        "Fixtures create DataFrames with explicit StructType to avoid ambiguous inference, especially with nulls and decimals. Assertions compare schema and canonical rows; for large sets invariants or checksums are used carefully. Properties can verify that deduplicating twice is idempotent, that totals are preserved, or that a rule never produces null keys. Input contracts fail early with column and rule messages, before writing a partial table.",
        "A test with only happy path gives false confidence; covering every possible combination is unmanageable. Equivalence partitions and limits linked to business risks are selected. The order is checked only when a window and tiebreaker define it; otherwise it is compared as a whole. Full snapshots are fragile to new supported columns, so mandatory and extensible fields are distinguished. In integration, the real behavior of Delta, permissions and types that a local fixture does not reproduce are confirmed."
      ],
      "concepts": [
        {
          "term": "Semantic contract",
          "definition": "Specification of schema, keys, quality and meaning that a transformation promises to accept and produce for its consumers.",
          "whyItMatters": "Detects regressions that compile and run correctly but alter the meaning, uniqueness, or integrity of the data product."
        },
        {
          "term": "Equivalence partition",
          "definition": "Class of inputs that should activate the same behavior, represented by a few carefully chosen cases in the tests.",
          "whyItMatters": "It provides meaningful coverage without enumerating infinite combinations or relying on huge production copies."
        },
        {
          "term": "Canonical comparison",
          "definition": "Normalization of order, types and representation before contrasting two DataFrames that must be semantically equivalent.",
          "whyItMatters": "It avoids failures due to non-guaranteed distributed order and keeps visible the differences that do belong to the contract."
        }
      ],
      "workedScenario": {
        "situation": "An SCD transformation passes its tests because it generates four rows, but a late arrival creates two current records for the same customer and breaks next-day billing.",
        "reasoning": [
          "Add to the contract exactly one current row per key, non-overlapping intervals and deterministic tie-breaking by sequence and timestamp.",
          "Build fixtures with tie, late event, duplicate and null, running real Spark and comparing rows and invariants without depending on physical order.",
          "Test idempotency by reprocessing the same batch and running integration against a temporary Delta table to verify MERGE and constraints."
        ],
        "outcome": "The test reproduces and blocks the regression, the pipeline maintains consistent intervals, and the team has a reusable contract for future CDC changes."
      }
    },
    "keyPoints": [
      "Materialize small actions to execute the plan under test.",
      "Compare schema and content with deterministic order.",
      "Includes synthetic edge cases free of personal data."
    ],
    "decisions": [
      "Materialize small actions to execute the plan under test.",
      "Compare schema and content with deterministic order.",
      "Includes synthetic edge cases free of personal data."
    ],
    "example": {
      "title": "Unit testing a Spark transformation",
      "note": "The fixture tests a specific behavior; adds separate tests for nulls, time zone and schema."
    },
    "pitfalls": [
      "Just state that `df.count()` does not throw an error without checking values or schema.",
      "Compare unordered lists and accept intermittent tests by partitioning."
    ],
    "examDecision": "For DataFrame logic, it tests minimal synthetic inputs, forces evaluation, and validates schema plus business rules.",
    "checkpoint": {
      "question": "Why is `result = transform(df)` not sufficient as a test?",
      "answer": "By lazy evaluation: many errors appear only when executing an action, and the semantics of the result have not yet been checked."
    }
  },
  "m28-l3": {
    "summary": "Distribute reproducible wheels and set dependencies at the correct level to prevent notebook, job, and serverless from resolving different environments.",
    "explanation": [
      "A wheel packages modules and metadata into a versioned artifact. Declare direct dependencies in `pyproject.toml`, create a lock or constraints for CI, and fix versions when reproducibility requires it. In jobs, install the wheel as the task library; for classic compute you can store it in workspace files or Unity Catalog Volumes depending on access mode and runtime.",
      "Serverless uses environments and does not support init scripts. Fix packages and test the selected environment version. Avoid `%pip install` scattered across production notebooks: you can restart Python, change precedence, and have two tasks run different code. The promotion should move the same wheel hash, not reconstruct it from different sources in each environment."
    ],
    "deepDive": {
      "mentalModel": "A wheel is an immutable unit of a Python distribution: it contains code and version metadata, not the promise that any environment will resolve dependencies the same. Reproducibility requires separating runtime, development, and platform dependencies, setting ranges or locks where appropriate, and building once to promote the same artifact. Installing from a cell makes each run solve the world anew and can produce different results between notebook, job and serverless. Libraries already provided by Databricks, such as PySpark, are usually declared in a way that development knows their API without unnecessarily packaging them. Native dependencies require architectural and runtime support, not just a name in pyproject.",
      "mechanics": [
        "pyproject.toml defines build backend, name, version, packages and dependencies. The build creates a wheel whose hash can be published to an artifact repository or governed volume. CI installs the artifact in a clean environment, runs tests, and logs SBOM or resolved list. In a bundle, artifacts can build and synchronize the wheel so that a Python wheel task executes package_name and entry_point. The artifact version is linked to the commit and is never overwritten under the same identifier.",
        "Fixing absolutely every dependency can prevent security patches; Wide ranges allow unexpected drift. One strategy uses reproducible lock for build, automated update, and testing before rolling out. Development dependencies do not travel to production, and secrets are never incorporated into the package. Serverless supports concrete mechanisms and does not guarantee arbitrary init scripts; compatibility is checked early. Promoting the same wheel avoids rebuilds per environment, while configuration and credentials are injected at runtime."
      ],
      "concepts": [
        {
          "term": "wheels",
          "definition": "Built and installable Python distribution format that packages code, metadata, and entry points with a defined version.",
          "whyItMatters": "Create a promotable and traceable artifact instead of copying code or reinstalling it ad hoc."
        },
        {
          "term": "Lock dependencies",
          "definition": "Concrete, versioned resolution of transitive packages used to deliberately rebuild an equivalent environment.",
          "whyItMatters": "Reduces drift between CI and execution, although it must be updated with tests to receive security fixes."
        },
        {
          "term": "Build once, promote",
          "definition": "Practice of building an artifact once and moving exactly the same bytes through test and production.",
          "whyItMatters": "It eliminates differences introduced by reconstructions and allows behavior to be attributed to a verifiable version."
        }
      ],
      "workedScenario": {
        "situation": "The production job fails after a deploy even though staging passed: both installed analytics-lib without lock and resolved different transitive versions six hours apart.",
        "reasoning": [
          "Compare resolved environments and confirm drift, then build a versioned wheel next to a lock and register hashes of both in CI.",
          "Install the artifact in a clean environment, run unit and integration and promote the exact same wheel to staging and production.",
          "Configure controlled renewals of dependencies with scanning and tests, and eliminate dynamic installations of notebooks and entrypoints."
        ],
        "outcome": "All three environments execute equivalent bytes and dependencies; deployment becomes reproducible and future transitive updates arrive through reviewable changes, not temporal randomness."
      }
    },
    "keyPoints": [
      "Promotes the same immutable artifact between dev, test and prod.",
      "Declare direct dependencies and control transitive resolution.",
      "Adapt the installation to serverless, access mode and governed location."
    ],
    "decisions": [
      "Promotes the same immutable artifact between dev, test and prod.",
      "Declare direct dependencies and control transitive resolution.",
      "Adapt the installation to serverless, access mode and governed location."
    ],
    "example": {
      "title": "Minimum package metadata in pyproject.toml",
      "note": "Don't blindly declare PySpark as a runtime dependency if it is provided by the Databricks environment; Documents how each test target contributes it."
    },
    "pitfalls": [
      "Rebuild the wheel in prod and obtain transitive dependencies other than test.",
      "Use init scripts to manage serverless packages, where they are not supported."
    ],
    "examDecision": "Build a wheel once, verify its hash, and promote that artifact; The environment provides Spark and the project dependencies are declared.",
    "checkpoint": {
      "question": "What risk avoids promoting exactly the same wheel from test to prod?",
      "answer": "Avoid code divergence or dependencies caused by different rebuilds and resolutions between environments."
    }
  },
  "m28-l4": {
    "summary": "Combines quick unit tests with Databricks integration to cover catalogs, permissions, formats and distributed behavior.",
    "explanation": [
      "Unit tests verify functions and contracts with small data; they do not demonstrate that the main service can read Unity Catalog, that the wheel is installed, or that a `MERGE` is idempotent. Integration tests deploy to an isolated catalog, run the entry point with real identity and validate side effects. They should use unique names per run and clean up only resources tagged as temporary.",
      "Databricks allows you to run pytest in the workspace and Databricks Connect can bring local development closer to remote computing. Keep the pyramid: many networkless tests, fewer integrations and few end-to-end tests. Mark suites and set timeouts so CI doesn't accidentally run a full load."
    ],
    "deepDive": {
      "mentalModel": "Unit and integration tests answer different questions. A unit test asks whether a rule produces the correct result with controlled inputs and without relying on external resources. An integration asks if the artifact works with actual Spark, Unity Catalog, Delta, identities, permissions, networking, and configuration. Simulating everything in unit tests does not prove that a GRANT exists; Executing all cases in a workspace makes feedback slow and expensive. The appropriate pyramid concentrates combinations and limits in quick tests, and reserves few representative routes for platform boundaries. Each test has isolated data and resources, cleans what it creates and emits sufficient evidence to distinguish functional failure from environmental failure.",
      "mechanics": [
        "pytest can share a local SparkSession for transformations, use schema fixtures, and parameterize cases. The adapters are replaced by fakes that respect their contract, not by mocks of each internal call. The integration deploys a temporary catalog or schema with service identity, loads seed data, runs the wheel or job and checks tables, history, permissions and expected errors. Unique names per run avoid collisions; teardown is executed even in the event of a failure and a policy limits the scope of the principal.",
        "A full integration can be slow or flaky due to infrastructure; Surface is minimized and smoke tests are separated from periodic suites. Blindly retrying hides defects; only known transient faults receive retry and are measured. Negative permit tests are as important as the authorized road. It is promoted only if unit and a critical integration pass on the same artifact, but an environment availability failure is classified without automatically converting untested code to passing."
      ],
      "concepts": [
        {
          "term": "Unit test",
          "definition": "Quick, isolated testing of a rule or component with controlled inputs and external dependencies replaced by simple contracts.",
          "whyItMatters": "It allows you to explore numerous edge cases and locate regressions without paying for deployment or platform variability."
        },
        {
          "term": "Integration test",
          "definition": "Test that runs the artifact against relevant real services to validate compatibility, permissions, formats, and distributed behavior.",
          "whyItMatters": "Detects failures that a local simulation does not reproduce, especially in Unity Catalog, Delta, network and identity."
        },
        {
          "term": "run isolation",
          "definition": "Use of unique names, data, and resources for each automated execution of the integration suite.",
          "whyItMatters": "Avoids collisions between parallel pipelines and allows you to safely clean only the objects created by that test."
        }
      ],
      "workedScenario": {
        "situation": "A transformation passes 180 local tests, but the production job cannot create the target table because the main service lacks CREATE TABLE and the schema uses an incompatible Delta feature.",
        "reasoning": [
          "Keep the unit tests for semantics and add a minimal integration that deploys the wheel with the same identity and target runtime.",
          "Create an isolated schema, perform read, transform, and write, and explicitly test for both allowed permissions and a denied operation.",
          "Capture history and table protocol, clean up resources per run and block promotion when the integration of the same artifact does not finish correctly."
        ],
        "outcome": "The pipeline detects permissions and compatibility before production, maintains fast unitary feedback and reduces integration to a stable path of a few minutes."
      }
    },
    "keyPoints": [
      "Unit tests cover logic; Integration covers platform, permissions and side effects.",
      "Isolates test catalogs/schemas per run.",
      "Flag slow suites and limit data, time and cost."
    ],
    "decisions": [
      "Unit tests cover logic; Integration covers platform, permissions and side effects.",
      "Isolates test catalogs/schemas per run.",
      "Flag slow suites and limit data, time and cost."
    ],
    "example": {
      "title": "Idempotent integration test",
      "note": "The `target_table` fixture should create an isolated name and delete only that object upon completion, even if the test fails."
    },
    "pitfalls": [
      "Run integrations against shared tables and generate collisions between branches.",
      "Replace all tests with mocks and not detect incompatible permissions or DDLs."
    ],
    "examDecision": "It uses unit tests for pure logic and a bounded integration layer for identity, catalogs, artifact and side effects.",
    "checkpoint": {
      "question": "What bug would only an integration test likely detect?",
      "answer": "That the main service of the job lacks `USE SCHEMA` or that the wheel cannot be installed in the chosen access mode."
    }
  },
  "m28-l5": {
    "summary": "Turn quality into a promotion gate: format, types, unit tests, integration, security and artifact contract.",
    "explanation": [
      "A CI pipeline must fail soon: lint and type check, unit tests, wheel build, scanning and validation of the bundle. The integration is executed with a non-human identity and minimal permissions on an ephemeral or compartmentalized target. Maintains test report, artifact hash and commit to reconstruct the deployment decision.",
      "The secrets belong to the identity provider or the secrets manager of the CI; prefers OAuth workload identity/service principal to user PAT. Promoting to production requires that the same passed artifact be referenced by the prod configuration. Adds rollback to the previous version and a post-deploy check before directing real triggers."
    ],
    "deepDive": {
      "mentalModel": "A promotion gate is an automated risk policy. It doesn't try to prove that the software is perfect; requires proportional evidence before allowing the same artifact to advance. The order usually goes from cheap to expensive: format and lint, types and security, unit tests, build, contract tests and integration. Failing early saves capacity and provides concrete feedback. The gate also validates the artifact and configuration to be deployed, not just the branch. Percentage coverage does not replace relevant cases and a scan without a severity policy generates noise. Exceptions are explicit decisions, with responsibility and expiration, never a click without registration to skip an uncomfortable signal. In Databricks automation, the current name is Declarative Automation Bundles; Asset Bundles is the alias that still appears in the 2025 Professional blueprint.",
      "mechanics": [
        "CI takes an immutable commit, installs reproducible dependencies, runs checks and builds the wheel. It is hashed, published, and that artifact goes to integration; a bundle is validated against the corresponding target. Each gate produces machine-readable evidence and avoids deploying if it breaches a threshold. Branch protection or the delivery system requires correct statuses and reviews. Credentials are service-based, short-lived when possible, and each environment grants only necessary permissions.",
        "Redundant checks increase time without reducing risk; Unstable checks teach you to ignore red. Duration and false failure rate are measured, independent stages are parallelized and a diagnostic path is preserved. A security finding is evaluated for severity and exploitability, with a documented policy. Urgent changes can use an audited break-glass process that automatically creates follow-up work. Production receives exactly the tested artifact; reconstructing after approval invalidates some of the evidence."
      ],
      "concepts": [
        {
          "term": "Promotion gate",
          "definition": "Automated, auditable condition that requires defined evidence before moving an artifact to the next delivery environment.",
          "whyItMatters": "Turn standards into consistent behavior and prevent time pressure from silently eliminating critical tests."
        },
        {
          "term": "Build evidence",
          "definition": "Results, hashes, reports and metadata that link a commit to the exact artifact and the verifications executed.",
          "whyItMatters": "It allows you to demonstrate what was tested and avoids promoting bytes other than those that were approved."
        },
        {
          "term": "Break-glass",
          "definition": "Exceptional and controlled route to temporarily bypass a barrier under mandatory authorization, registration and monitoring.",
          "whyItMatters": "It allows you to respond to emergencies without turning the exception into an invisible and permanent daily bypass."
        }
      ],
      "workedScenario": {
        "situation": "An urgent hotfix passes unit tests, but the scan finds a critical dependency and the integration fails intermittently; The team wants to rebuild manually and deploy directly from a laptop.",
        "reasoning": [
          "Determine if the vulnerability reaches the code and if the environmental failure is transient, preserving logs and avoiding rebuilding a different artifact.",
          "Correct or mitigate the dependency, stabilize the fixture and repeat gates on the same commit, or activate break-glass only with accepted risk and expiration.",
          "Promote the proven hash via service identity, verify production smoke, and create automatic follow-up for any outstanding exceptional checks."
        ],
        "outcome": "The hotfix arrives with traceability and without artisanal bytes; The organization maintains speed of response while maintaining explicit proof of accepted and resolved risk."
      }
    },
    "keyPoints": [
      "Fail fast before consuming remote compute.",
      "CI uses non-human identity and least privilege.",
      "Sign the promotion with commit and hash of the artifact."
    ],
    "decisions": [
      "Fail fast before consuming remote compute.",
      "CI uses non-human identity and least privilege.",
      "Sign the promotion with commit and hash of the artifact."
    ],
    "example": {
      "title": "Order of doors in CI",
      "note": "Adapt the syntax to the chosen CI; the important principle is that prod uses the hash that passed these gates."
    },
    "pitfalls": [
      "Using a developer's personal PAT and losing the pipeline when they change teams.",
      "Deploy from local branch after CI tried another commit."
    ],
    "examDecision": "Promotes only traceable artifacts that passed automatic gates with service identity; validates and preserves rollback.",
    "checkpoint": {
      "question": "What two identifiers allow us to demonstrate which code reached production?",
      "answer": "The source commit and the hash/version of the deployed wheel."
    }
  },
  "m29-l1": {
    "summary": "Model Databricks code, artifacts, and resources as a versioned declarative unit using Declarative Automation Bundles.",
    "explanation": [
      "Declarative Automation Bundles—formerly Asset Bundles—describe jobs, pipelines, permissions, artifacts, and configuration along with the code. `databricks.yml` identifies the bundle and may include files per domain; `resources` uses the Databricks API schema, while `artifacts` builds wheels or other deliverables. `sync` controls which sources are sent to the workspace.",
      "A bundle does not replace Terraform for account or cloud infrastructure. Its natural boundary is project resources within Databricks. Avoid a monolithic YAML: separate `resources/jobs.yml`, `resources/pipelines.yml` and variables; validates that references like `${resources.jobs.orders.id}` are resolved without hardcoding IDs between environments."
    ],
    "deepDive": {
      "mentalModel": "Declarative Automation Bundles describe an entire Databricks project as code: sources, artifacts, resources, variables, permissions, and targets form a unit that can be reviewed and deployed repeatedly. As of March 16, 2026, this is the official name of the capability formerly called Databricks Asset Bundles; The current Professional blueprint, published before the change, retains Asset Bundles, but both names point to the same evaluable mechanism. The bundle does not replace provisioning the entire account nor does it convert any script into declarative infrastructure. Its boundary is the project and its application resources, such as Lakeflow Jobs and pipelines, linked to versioned code and a deployment identity.",
      "mechanics": [
        "The databricks.yml file identifies the bundle and can include resources, artifacts, variables, includes, and targets; The included files make up a final configuration. The CLI loads that configuration, resolves substitutions, and deploys resources with identity and state associated with the target. Artifacts builds, for example, a wheel and references it from a task. Declared resources are reviewed along with the code, so schedule, parameters and dependencies are no longer invisible manual changes. Validate detects schema and references before touching the workspace.",
        "A bundle manages supported resources within its scope, but networks, cloud accounts, or global configuration may require Terraform or another layer. Putting all teams in a monolithic bundle increases blast radius and ambiguous ownership; Splitting too much duplicates contracts. The right unit groups together resources that are versioned, tested, and promoted together. Terminological equivalence is documented for examination: if a question mentions Asset Bundles, it is reasoned with current Declarative Automation Bundles, without inventing a different technology migration."
      ],
      "concepts": [
        {
          "term": "Declarative Automation Bundle",
          "definition": "Versioned definition of a Databricks project that groups code, artifacts, configuration, and deployable resources using the CLI.",
          "whyItMatters": "It makes both logic and operational settings that could previously be changed manually reviewable and repeatable."
        },
        {
          "term": "Asset Bundles",
          "definition": "Former name of Declarative Automation Bundles, still present in the Professional blueprint of November 30, 2025.",
          "whyItMatters": "Recognizing the alias avoids treating an exam question as an obsolete product or different from the current mechanism."
        },
        {
          "term": "Declarative resource",
          "definition": "Workspace object whose desired configuration is expressed in YAML, such as a Lakeflow Job, pipeline, or compatible dashboard.",
          "whyItMatters": "Allows you to review differences, apply consistent deployments, and rebuild configuration without manual editing of the environment."
        }
      ],
      "workedScenario": {
        "situation": "A team maintains notebooks in Git, but test and production Jobs are configured by hand and differ in retries, parameters, and main; no one can reproduce the environment after accidental deletion.",
        "reasoning": [
          "Define a Declarative Automation Bundle that includes wheel, Job, parameters, permissions and targets, registering that Asset Bundles is the alias used by the blueprint.",
          "Validate the configuration and deploy first to an isolated development target, checking that the artifact and references are resolved from the commit.",
          "Consciously import the necessary configuration or recreate it declaratively, compare behavior and remove manual editing through permissions and change processing."
        ],
        "outcome": "Code and operation become a reproducible unit; the team can reconstruct both environments and respond correctly to current or historical certification terminology."
      }
    },
    "keyPoints": [
      "The bundle unites resource configuration and versioned artifacts.",
      "Use includes and references instead of duplicating IDs.",
      "Keep credentials and cloud infrastructure that are not specific to the project out."
    ],
    "decisions": [
      "The bundle unites resource configuration and versioned artifacts.",
      "Use includes and references instead of duplicating IDs.",
      "Keep credentials and cloud infrastructure that are not specific to the project out."
    ],
    "example": {
      "title": "Minimal anatomy of a bundle",
      "note": "The job resource can live in `resources/orders.job.yml` and reference the wheel built by the artifact."
    },
    "pitfalls": [
      "Save host, token or password inside `databricks.yml`.",
      "Use bundles to create networks, buckets, and metastores that belong to another infrastructure layer."
    ],
    "examDecision": "Use Bundles for the Databricks project lifecycle; account/cloud IaC reservation for Terraform or other dedicated tool.",
    "checkpoint": {
      "question": "What is the advantage of referencing a job by `${resources.jobs.<key>.id}`?",
      "answer": "The ID is resolved by target and deployment, avoiding hardcoding different identifiers between workspaces."
    }
  },
  "m29-l2": {
    "summary": "Define dev, test and prod targets with minimal overrides, isolated routes and modes that clearly express the intention of each environment.",
    "explanation": [
      "A target applies variables, workspace, mode and overrides to the same base definition. Development mode adds appropriate isolation to the developer and allows iteration; production mode applies validations and stable names. The variables change catalog, schema, policy or warehouse, but should not duplicate the entire job definition.",
      "Use `${bundle.target}` and `${workspace.current_user.userName}` for development paths, and a stable deployment identity in production. Define `run_as` explicitly: the deployer does not have to be the executer. Before promoting, compare the plan for unexpected deletions or replacements."
    ],
    "deepDive": {
      "mentalModel": "A target is not a complete copy of the project, but a controlled transformation of a common base. The shared configuration expresses what must remain identical; overrides declare only legitimate differences such as workspace, identity, catalog, schedule or scale. The development and production modes add conventional behaviors and guardrails, but do not replace an explicit review of each difference. Isolation uses root paths, schemas and names that prevent collisions between developers or environments. If each target contains a second complete definition, the drift is incorporated into the design. If there is no difference, production can inherit paths or development permissions. The goal is to minimize variation without pretending that safety and capacity are equal.",
      "mechanics": [
        "Targets within databricks.yml can set workspace host and root_path, variables, mode and resource overrides. Substitutions compose names and references from the active target. Development mode can apply appropriate conventions to personal iteration, while production mode expects more stable configuration and consistent controls. Variables are resolved from defaults, target or CLI according to precedence; Non-secret values ​​can be versioned, but credentials are obtained through authentication and secure resources, not YAML.",
        "Excessive overrides make it impossible to know what was tested; The base must include code, graph, semantic parameters and common policies. Capacity, schedules and catalogs may vary when the environment demands it. A shared path between targets can overwrite state or files, so uniqueness is tested with identity and target. The effective plan is generated or inspected, sensitive values ​​are reviewed and a smoke is executed per environment. The same artifact is promoted without rebuilding it."
      ],
      "concepts": [
        {
          "term": "target",
          "definition": "Named configuration that selects workspace, mode, variables and overrides to deploy the same project in a specific environment.",
          "whyItMatters": "Enables repeatable promotion without maintaining divergent copies of code and resources for development, testing, and production."
        },
        {
          "term": "Minimum override",
          "definition": "Explicit difference limited to what really changes between environments, the rest inheriting from a shared base.",
          "whyItMatters": "It reduces drift and makes visible which production properties were not exercised in an equivalent way in testing."
        },
        {
          "term": "Root path",
          "definition": "Workspace path used by the bundle to store files and state deployed under an identity and target.",
          "whyItMatters": "A unique design per environment or developer avoids collisions, overwrites, and ambiguous ownership between deployments."
        }
      ],
      "workedScenario": {
        "situation": "Two developers deploy the same bundle to dev and overwrite files; production inherits a disabled schedule because the three targets duplicate the entire resource with hidden differences.",
        "reasoning": [
          "Move the Job definition to a common base and leave only legitimately different host, root path, catalog, schedule and scale on each target.",
          "Parameterize the development path by identity, apply appropriate modes, and review the effective configuration for unresolved or inherited variables.",
          "Deploy the same hash to dev, test and production, run smoke and lock full copies of resources through automated review and validation."
        ],
        "outcome": "Personal deployments become isolated, the production schedule becomes a visible difference, and the project retains a single source of truth for its behavior."
      }
    },
    "keyPoints": [
      "A common base reduces drift; targets only express real differences.",
      "Isolates paths and development names per user/target.",
      "Separates deployment identity from `run_as` of the workload."
    ],
    "decisions": [
      "A common base reduces drift; targets only express real differences.",
      "Isolates paths and development names per user/target.",
      "Separates deployment identity from `run_as` of the workload."
    ],
    "example": {
      "title": "Targets with variables and modes",
      "note": "Declare `prod_run_as` over a secure configuration channel; do not paste credentials or a personal user ID."
    },
    "pitfalls": [
      "Copy the entire job into each target and allow their DAGs to diverge.",
      "Run production as the developer who launched the deploy."
    ],
    "examDecision": "Maintain a common definition and limit overrides to catalog, identity, size or schedule; production uses stable main service.",
    "checkpoint": {
      "question": "Why should `run_as` be separated from the user running `bundle deploy`?",
      "answer": "So that permissions and job continuity depend on a governed service identity, not a person."
    }
  },
  "m29-l3": {
    "summary": "Use `validate`, `plan`, `deploy` and `run` as different gates; don't turn a successful deploy into sufficient proof of the workload.",
    "explanation": [
      "`bundle validate` resolves configuration and checks the schema against the target. `bundle plan` shows planned actions without applying them. `bundle deploy` synchronizes artifacts and resources, and `bundle run` runs an already deployed resource. A secure pipeline captures the plan, requires approval for destructive changes, and deploys the same validated artifact.",
      "Validation does not run SQL or show `run_as` data permissions. After deploying, it runs a smoke test with parameters and limited data, checks status and contract, and only then enables triggers or production traffic. Use `bundle summary` and structured output for traceability."
    ],
    "deepDive": {
      "mentalModel": "Validate, plan, deploy and run answer different questions. Validate verifies that the configuration composes and references valid elements; plan shows the expected change without applying it; deploy materializes resources and artifacts; run runs an already deployed resource. No stage automatically implies the next. A valid YAML can describe a destructive change, a successful deploy can contain faulty code, and a successful run can publish semantically erroneous data. Robust delivery places evidence between transitions: plan review, approval according to environment, smoke and data validation. In the blueprint above, these operations appear under Asset Bundles; in the current CLI they belong to Declarative Automation Bundles and retain the same reasoning.",
      "mechanics": [
        "The CLI resolves the target and runs bundle validate before the CI authorizes changes. The effective plan identifies creates, updates, or deletes and should be retained as a review artifact when the flow supports it. Deploy synchronizes files, builds or loads artifacts, and updates resources within the bundle state. Run invokes a job or pipeline by its resource key and can receive supported parameters. Exit codes and run IDs are captured so each gate knows what happened.",
        "Automating deploy immediately after validate reduces friction, but eliminates an opportunity to detect drift or unexpected deletion in production. Requiring manual approval for everything slows down development; It is applied by risk, target and exchange rate. Run does not replace integration tests: it tests the entire resource, but requires assertions on tables and contracts. A dry run without representative data also does not demonstrate scalability. The pipeline retains the same artifact, applies the least necessary authority, and fails closed if the plan cannot be revised."
      ],
      "concepts": [
        {
          "term": "Bundle validation",
          "definition": "Static checking of structure, types, references and resolved configuration for a target before modifying remote resources.",
          "whyItMatters": "It detects cheap errors early, although it does not guarantee security of change or correctness of the executed code."
        },
        {
          "term": "Deployment plan",
          "definition": "Preview of the actions that would align the actual resources with the bundle's declared configuration.",
          "whyItMatters": "Allows you to review unexpected updates or deletions before they affect a shared or production environment."
        },
        {
          "term": "smoke run",
          "definition": "Small post-deployment run that confirms boot, identity, dependencies, and a critical walkthrough of the resource.",
          "whyItMatters": "It bridges the gap between correctly created resources and a workload truly capable of operating in that environment."
        }
      ],
      "workedScenario": {
        "situation": "CI validates a bundle and deploys automatically; A refactoring changes a resource key and the plan attempts to delete and recreate the production Job, losing its operational identity.",
        "reasoning": [
          "Separate validate from plan, preserve the diff, and classify deletes or replacements as changes that require explicit approval in production.",
          "Keep the key stable or run a documented migration, then deploy the same artifact and verify the resulting permissions and schedule.",
          "Launch a smoke run, check exit contract and record run ID, plan and hash as evidence before completing the promotion."
        ],
        "outcome": "Unexpected recreation stops before being applied; The identity of the Job is preserved and the flow demonstrates configuration, execution and data through separate gates."
      }
    },
    "keyPoints": [
      "Validate checks configuration; plan anticipates changes; deploy apply; run checks execution.",
      "Manually check for destructive changes before deploying.",
      "Add smoke test post-deploy before activating production."
    ],
    "decisions": [
      "Validate checks configuration; plan anticipates changes; deploy apply; run checks execution.",
      "Manually check for destructive changes before deploying.",
      "Add smoke test post-deploy before activating production."
    ],
    "example": {
      "title": "Safe promotion sequence",
      "note": "Don't use `--force` to skip branch validations as normal CI behavior."
    },
    "pitfalls": [
      "Deploy directly to prod without reading a plan that removes or replaces resources.",
      "Confuse validated bundle with functional job on real data and permissions."
    ],
    "examDecision": "Validate and plan before deploying; Test the deployed resource with a smoke test before activating the trigger.",
    "checkpoint": {
      "question": "What does `bundle plan` provide that `bundle validate` does not?",
      "answer": "Shows the resource actions—create, update, or delete—that the deployment would perform on that target."
    }
  },
  "m29-l4": {
    "summary": "Authenticate CI with OAuth and apply promotion by environment without personal tokens, rebuilds or manual workspace editing.",
    "explanation": [
      "CI must use workload identity federation or a principal service with OAuth and permissions limited to the target workspace/resources. Secrets, hosts, and client IDs live in the CI system or secure profiles. A personal PAT has a human life cycle, privileges that are difficult to justify, and risk of exposure; It is not the appropriate production identity.",
      "Build and test the wheel, publish a hash manifest, deploy to test, and promote the same artifact to prod. Protect the prod environment with approval and branch policy. Prohibit manual edits to bundle-managed resources or document a change import process, because the next deploy can overwrite drift."
    ],
    "deepDive": {
      "mentalModel": "CI is a production actor and must have its own identity. OAuth for a core service delivers renewable or short-lived credentials and clearly separates automation from a person; A personal access token binds continuity, auditing, and revocation to the user who created it. Promoting does not mean rebuilding: CI takes the artifact whose hash passed tests, authenticates against the target, and applies only required deployment and execution permissions. Separating identities by environment limits blast radius, although an organization may opt for a common principal with explicit access when its model warrants it. In both cases, the secrets live in the CI provider and never in databricks.yml, logs or wheel.",
      "mechanics": [
        "The CLI supports OAuth profiles and methods; For automation, machine-to-machine authentication of the main service is configured and values ​​are injected using protected secrets. The principal must exist in the target workspaces and receive permissions on exact resources and routes. CI selects target, validates expected host, and avoids mixing --profile with options that produce an ambiguous identity. Audit logs record actions of the principal, making it easy to distinguish deploy from workload execution when separate identities are used.",
        "A principal per environment improves privacy and revocation, but increases management; A shared one simplifies setup and expands the impact of a credential. It is chosen according to separation of functions, regulatory requirements and automation of registrations. Tokens are rotated without modifying the repository and are hidden in log writing. The promotion records artifact, commit, approver, target and identity. Permissions are tested negatively: test CI should not be able to deploy to production even if you change an argument."
      ],
      "concepts": [
        {
          "term": "OAuth M2M",
          "definition": "Machine-to-machine authorization flow by which a core service obtains tokens without relying on a human session.",
          "whyItMatters": "Improves turnover, continuity and IC attribution versus long-term personal credentials."
        },
        {
          "term": "Main service",
          "definition": "Governed non-human identity that represents an application or automation and receives explicit permissions on each workspace.",
          "whyItMatters": "Separates pipeline responsibility from users and allows independent least privilege, auditing and revocation."
        },
        {
          "term": "Immutable promotion",
          "definition": "Movement of the same tested artifact between environments without rebuilding or modifying its bytes during the process.",
          "whyItMatters": "It guarantees that the test evidence corresponds exactly to the code that finally reaches production."
        }
      ],
      "workedScenario": {
        "situation": "The pipeline uses the PAT of an administrative engineer. During your vacation the account is deactivated, deployments fail, and the token accidentally appears in the output of a task.",
        "reasoning": [
          "Revoke the PAT, review audit logs and create a main service with OAuth M2M and specific minimum permissions for each bundle target.",
          "Save credentials to the CI vault with redaction, check the host and block the test principal from acting in production.",
          "Promote a wheel by hash, register identity and target, and test rotation without changing code or versioned project configuration."
        ],
        "outcome": "Delivery is no longer dependent on a person, exposure is contained, and each deployment is attributed to an automated identity with verifiable scope."
      }
    },
    "keyPoints": [
      "CI uses OAuth and least privilege principal service.",
      "The same hash goes through test and production.",
      "Declarative resources are not edited manually without reconciling code."
    ],
    "decisions": [
      "CI uses OAuth and least privilege principal service.",
      "The same hash goes through test and production.",
      "Declarative resources are not edited manually without reconciling code."
    ],
    "example": {
      "title": "Conceptual contract for a CI promotion",
      "note": "The file illustrates evidence; credentials are obtained by OAuth and are never written to the manifest."
    },
    "pitfalls": [
      "Reuse an administrator PAT for all workspaces.",
      "Rebuild the package in each environment and lose identity of the artifact."
    ],
    "examDecision": "production CI/CD uses non-human identity, target privileges and immutable promotion; Avoid manual shifts that introduce drift.",
    "checkpoint": {
      "question": "Why is a personal PAT a bad production dependency?",
      "answer": "It expires or is revoked with the person, often has excessive permissions, and does not represent a stable operational identity."
    }
  },
  "m29-l5": {
    "summary": "Manage drift, ownership, permissions and rollback as part of the bundle so that a deployment is reversible and auditable.",
    "explanation": [
      "A manually created resource can be incorporated through generation or binding depending on support, but first you must decide who will be its source of truth. Two bundles should not manage the same job. Use declared permissions, stable names, and operational ownership; reviews the plan when the identity or root path changes because it may appear to be a new resource.",
      "Rollback typically deploys the latest known version of the bundle and artifact, it does not automatically restore data. Schema changes require a forward and backward compatible strategy. Maintains manifest, plan and smoke test results by release; If a deploy fails midway, inspect the actual state before relaunching."
    ],
    "deepDive": {
      "mentalModel": "The declared state, the deployed state, and the state that actually runs production can diverge. Drift appears when someone edits a resource outside of the bundle, another automation shares ownership, or an external reference changes. The bundle needs an owner boundary: a resource has a source of truth and an identity authorized to modify it. Permissions are also configuration and should prevent the deploy from removing itself from access or granting excessive control. Rollback is not always applying the previous commit: code, schema and data may have evolved. A reversible strategy preserves artifacts, plans, backward compatibility, and procedures for stopping, redeploying, or moving forward with a fix.",
      "mechanics": [
        "The identity and resource keys allow the bundle to update existing objects within its state. Manual edits may be overwritten on the next deploy or produce an unexpected plan; That is why they are restricted and detected by reviewing the plan. Declarative permissions assign CAN_VIEW, CAN_MANAGE_RUN or other levels depending on the resource, and ownership is maintained in groups or operational principals, not people. A deploy records commit, target, and artifacts so that a previous version can be located.",
        "Configuration rollback is easy if the resource and its inputs remain compatible; reverting a schema migration or a side effect is not. Expand-contract changes, feature flags and compatible writes that allow version N or N-1 to be executed during the window are preferred. Destroying and recreating may lose history, URLs or triggers. The runbook decides stop, repair, redeploy or roll-forward depending on the impact. After recovering, drift is reconciled and any permissions or temporary changes are removed."
      ],
      "concepts": [
        {
          "term": "Drift",
          "definition": "Difference between the versioned configuration that is considered desired and the actual state modified by people or external automations.",
          "whyItMatters": "It makes deployments unpredictable and can reintroduce manual changes, incorrect permissions, or orphaned resources."
        },
        {
          "term": "Ownership boundary",
          "definition": "Rule that assigns a single source of truth and authorized managers to manage each deployed resource.",
          "whyItMatters": "Prevents two systems from competing for the same object and overwriting each other's configuration."
        },
        {
          "term": "Expand-contract",
          "definition": "Change strategy that first adds new compatibility, migrates consumers, and then retires the old form.",
          "whyItMatters": "It maintains a window where adjacent versions work and makes rollback viable without destructively reverting data."
        }
      ],
      "workedScenario": {
        "situation": "An operator manually changes retries in production during an incident; The next deploy reverts them and also a migration renames a column that the previous version needs for rollback.",
        "reasoning": [
          "Capture and decide whether the manual change should be encrypted or retired, restricting future edits and reviewing the plan before deploying.",
          "Adopt expand-contract for the column, publish both names during the transition and preserve wheels and settings from both versions.",
          "Rehearse stop, redeploy and roll-forward, verify identity permissions and document how to reconcile temporary changes after the incident."
        ],
        "outcome": "The team rolls back without losing compatibility, eliminates competition between UI and bundle, and turns rollback into a proven procedure rather than a hope."
      }
    },
    "keyPoints": [
      "A resource has a single source of truth and a single proprietary bundle.",
      "Configuration rollback does not reverse data side effects.",
      "Review plan and actual status before repairing a partial deploy."
    ],
    "decisions": [
      "A resource has a single source of truth and a single proprietary bundle.",
      "Configuration rollback does not reverse data side effects.",
      "Review plan and actual status before repairing a partial deploy."
    ],
    "example": {
      "title": "Inventory before reconciling an existing resource",
      "note": "Don't blindly bind: confirm that no other bundle or process manages that resource."
    },
    "pitfalls": [
      "Create a duplicate job because you changed `root_path` or the bundle identity.",
      "Believing that deploying the previous version reverts rows already written."
    ],
    "examDecision": "When faced with drift, first establish the source of truth; use plan/binding consciously and design data rollback separately.",
    "checkpoint": {
      "question": "What doesn't redeploying the previous bundle solve by itself?",
      "answer": "It does not revert tables, messages or side effects that the faulty version already produced."
    }
  },
  "m30-l1": {
    "summary": "Build base access with ownership, groups and privilege inheritance, avoiding direct grants to people and ambiguous operational owners.",
    "explanation": [
      "Unity Catalog evaluates privileges in a hierarchy. To consult a table, `USE CATALOG`, `USE SCHEMA` and `SELECT` are usually used; Catalog or schema grants can be inherited by descendants according to the privilege model. Ownership grants broad capabilities, while `MANAGE` allows you to manage permissions without transferring ownership on supported objects.",
      "Assigns privileges to primary account and service groups, not to individual users. Separates producers, consumers and policy administrators. The owner of a catalog should not be a walk-away person, but rather a governed group. Use `SHOW GRANTS` and information schema to check effective access before adding another apparently necessary grant."
    ],
    "deepDive": {
      "mentalModel": "Unity Catalog combines a hierarchy of securables with two different ideas: ownership and privileges. The owner can manage the object and delegate; A privilege authorizes a specific action. Users also need to traverse the hierarchy using USE CATALOG and USE SCHEMA before SELECT or other permissions are given on the object. Inheritance allows granting in catalog or schema for present and future objects, which simplifies but broadens scope. The sustainable model assigns permissions to groups by function and ownership to operational or main groups, never to individuals as a normal mechanism. The least privilege is not the smallest number of grants, but the minimum understandable set that allows work and can be revoked without breaking ownership.",
      "mechanics": [
        "Securables are organized from metastore, catalog and schema to tables, views, volumes and functions. GRANT and REVOKE modify privileges, and SHOW GRANTS or information_schema help inspect them. Inheritable privileges granted at a higher level reach descendant objects according to the current model; Ownership includes administrative capacity and must be transferred deliberately. MANAGE allows you to manage grants without necessarily converting the actor into the owner. Workspace bindings also restrict from which workspaces certain catalogs or credentials are accessed.",
        "Direct grants to individuals accumulate exceptions and survive role changes; groups synchronized from the identity provider express function and life cycle. Granting SELECT at the catalog level is convenient, but may expose future tables; a schema per domain and separate groups reduces blast radius. Positive and negative routes are tested with real identities, including the ability to grant permissions. The automations are deployed with Declarative Automation Bundles, the current name of Asset Bundles in the blueprint, without mixing deployment ownership with reader access."
      ],
      "concepts": [
        {
          "term": "Securable",
          "definition": "A governed Unity Catalog object upon which ownership, privileges, policies, or workspace restrictions can be assigned.",
          "whyItMatters": "Define the exact authorization unit and avoid talking about generic access without identifying the catalog, schema or asset."
        },
        {
          "term": "Privilege inheritance",
          "definition": "Propagation of certain privileges granted in a container to its current and future descendant objects.",
          "whyItMatters": "Simplifies administration, but too high a grant can automatically expand access when new objects appear."
        },
        {
          "term": "Operational Ownership",
          "definition": "Assigning ownership to a stable group or principal responsible for the lifecycle, rather than one person.",
          "whyItMatters": "Prevent orphaned objects and maintain management when members, teams, or individual accounts change."
        }
      ],
      "workedScenario": {
        "situation": "The owner of a catalog leaves the company and 240 direct grants mix analysts, engineers and service principals; no one knows what future objects will be visible or who can revoke access.",
        "reasoning": [
          "Inventory ownership, effective grants and inheritance, and map roles to identity-managed groups before removing individual permissions.",
          "Transfer ownership to an operating group, grant USE and actions at the minimum stable level, and separate deploy, write, and read.",
          "Run positive and negative tests per functional person, revoke direct grants, and monitor requests and denials during the transition."
        ],
        "outcome": "The catalog maintains continuous administration, access is explained by groups and hierarchical level, and new tables no longer inherit accidental personal permissions."
      }
    },
    "keyPoints": [
      "Grant to groups and inherit from the most stable and limited level.",
      "Ownership is not the everyday mechanism for consuming data.",
      "Verify effective privileges and `USE` prerequisites before granting access."
    ],
    "decisions": [
      "Grant to groups and inherit from the most stable and limited level.",
      "Ownership is not the everyday mechanism for consuming data.",
      "Verify effective privileges and `USE` prerequisites before granting access."
    ],
    "example": {
      "title": "Read-only access per group",
      "note": "If the entire scheme shares the same contract, evaluate a grant in scheme; Don't expand more than the group needs."
    },
    "pitfalls": [
      "Grant `ALL PRIVILEGES` to users to resolve a missing `USE SCHEMA`.",
      "Leave production catalogs owned by a personal account."
    ],
    "examDecision": "Fix the `USE` string and least privilege on the object first; Use groups and stable operational ownership.",
    "checkpoint": {
      "question": "A group has `SELECT` on a table but cannot query it. What browsing privileges would you review?",
      "answer": "`USE CATALOG` in the catalog and `USE SCHEMA` in the schema containing the table."
    }
  },
  "m30-l2": {
    "summary": "Scale protection with governed tags and ABAC so that new classified objects receive policies without grants or manual masks per table.",
    "explanation": [
      "Governed tags are account tags with allowed values and assignment permissions. They inherit from catalog and schema to descendant objects, except for specific rules such as columns. ABAC evaluates those attributes and applies row filter or column mask policies in the defined scope. So the governance team writes a policy and the data stewards classify objects without being able to disable protection.",
      "ABAC requires compute compatible and governed tags, not free tags. Tag changes may take a few minutes to apply. Design small taxonomies—classification, region, domain—and avoid PII on tag values ​​because they can be replicated globally. Test for conflicts: If several different policies apply to the same user/object, access can be safely blocked."
    ],
    "deepDive": {
      "mentalModel": "ABAC protects data by attributes, not by a manual list in each table. Governed tags form a controlled taxonomy at the account level; A policy attached to a catalog, schema, or table selects objects whose labels meet a condition and applies a row filter or column mask. When a new column labeled PII appears, the policy can act automatically without waiting for another ALTER TABLE. That scales only if the classification is reliable, the tags have ownership, and the policy function is simple. ABAC complements privileges: first the user needs access to the object; then the policy limits visible rows or values. It is not a substitute for minimization, workspace binding, or a review of compute and sharing limitations.",
      "mechanics": [
        "Governed tags are defined with controlled values ​​and assignment permissions. A CREATE POLICY references an SQL function or inline logic and uses tag conditions to select targets; Its scope determines scope and inheritance. At query time, Unity Catalog evaluates policies applicable to the user and object and applies the function before returning data. Current ABAC requires compatible compute and has restrictions for time travel, clones, shares and policy combinations; multiple different policies on the same target can block access instead of guessing precedence.",
        "A taxonomy with hundreds of ambiguous tags produces inconsistent classification and unpredictable policies. Few dimensions such as sensitivity and residency are started, detection is automated but requires human validation for critical cases. Exceptions use EXCEPT with narrow, audited groups or principals; It is not added to individual users without expiration. Performance depends on function and pushdown complexity, so security and latency are tested. Policy changes are versioned and deployed with equivalent revision to the code."
      ],
      "concepts": [
        {
          "term": "Governed tag",
          "definition": "Catalog attribute defined with controlled values and permissions that classifies securables for consistent policies and governance.",
          "whyItMatters": "Prevents conflicting free labels and provides a reliable signal to automatically apply ABAC at scale."
        },
        {
          "term": "ABAC policy",
          "definition": "Central policy that selects objects by attributes and applies row filters or column masks at query time.",
          "whyItMatters": "Secure current and future objects consistently without maintaining separate manual rules for each table."
        },
        {
          "term": "Policy scope",
          "definition": "Hierarchical level where a policy is attached and from which it can evaluate matching descendant objects.",
          "whyItMatters": "Determines range and blast radius; A catalog policy requires more extensive testing than a table policy."
        }
      ],
      "workedScenario": {
        "situation": "Fifty schemas contain PII columns and each owner maintains a different mask; new boards remain unprotected for weeks and an acquisition will double inventory during the quarter.",
        "reasoning": [
          "Define governed tags for sensitivity and a simple mask function, classify a sample and check accuracy, ownership and compute compatibility.",
          "Create an ABAC policy in a pilot scope with minimal exceptions, and run positive, negative, latency, and limited operations tests.",
          "Expand across domains, audit assignments and conflicts, and remove manual masks only when automatic coverage and rollback are demonstrated."
        ],
        "outcome": "Newly tagged columns are protected immediately, logic is reduced to a reviewable policy, and the team retains explicit exceptions and limitations."
      }
    },
    "keyPoints": [
      "Governed tags control values and who can assign them.",
      "ABAC separates policy authors from table owners.",
      "Test compute compatibility, inheritance, and policy conflicts."
    ],
    "decisions": [
      "Governed tags control values and who can assign them.",
      "ABAC separates policy authors from table owners.",
      "Test compute compatibility, inheritance, and policy conflicts."
    ],
    "example": {
      "title": "Classify a table with governed tags",
      "note": "The tags must exist and the executor needs ASSIGN permission; The ABAC policy is managed separately at the catalog or schema level."
    },
    "pitfalls": [
      "Create free tags with `PII`, `pii` and `personal` variants and expect a consistent policy.",
      "Save customer names or emails in tags to decide access."
    ],
    "examDecision": "Use ABAC when many tables share classification-based rules; Reserve manual assignment per table for specific exceptions.",
    "checkpoint": {
      "question": "Why does ABAC scale better than a manually configured mask on each table?",
      "answer": "The policy is automatically applied to objects that meet the tags and also protects new classified tables without intervention by object."
    }
  },
  "m30-l3": {
    "summary": "Apply row filters and column masks with simple, deterministic and auditable functions, understanding their impact on optimization and interoperability.",
    "explanation": [
      "A row filter returns boolean and removes rows that the user should not see; a column mask returns the original value or transformed with a compatible type. They can be mapped directly to a table using SQL UDFs or centralized with ABAC. The policy is evaluated in query time and security takes precedence over optimizations that could leak information.",
      "Keep UDFs simple: avoid aggregations, windows, and non-deterministic logic that limits `MERGE` or pushdown. Test each group with representative users, including exempt administrators and service principals. Path access and certain external clients do not support tables with policies; Inventory interoperability and create a secure view or share where appropriate."
    ],
    "deepDive": {
      "mentalModel": "Row filters and column masks are safety transformations inserted into the query. A row filter decides whether each row can traverse; A mask replaces the visible value of a column and must return a compatible type. They can be manually assigned to a table or centralized using ABAC, which is recommended for repeated rules. Because the engine must prevent inferences about protected values, it prioritizes security over certain optimizations, and complex functions reduce pushdown or performance. A mask does not encrypt storage or erase data; controls the user's view in supported queries. The join keys, partitions, and columns used in the policy deserve special testing for semantics, performance, and DML limitations.",
      "mechanics": [
        "A filter is usually a boolean SQL UDF that receives columns and context, and only leaves true rows. A mask receives the value and optionally other columns, returns original or protected representation, and maintains convertible type. Manual assignment uses ALTER TABLE, while ABAC applies policies by governed tags. The engine evaluates identity and policies in query. Some Delta APIs, clones, time travel, shares, and runtime versions have limitations; Current documentation is verified before interoperability is promised.",
        "Functions with joins, subqueries or non-deterministic logic increase costs and make auditing difficult. Simple deterministic functions and well-governed entitlement tables are preferred when necessary. Tests cover authorized users, unauthorized users, nulls, aggregations, joins, and inference attempts; They also measure pruning and P95. A dynamic view may be more suitable for a complex curated presentation, while ABAC scales better for a uniform rule. The owner should not be able to bypass a central policy without an exception process."
      ],
      "concepts": [
        {
          "term": "rowfilter",
          "definition": "Security function evaluated in query that returns true only for rows visible by the current identity.",
          "whyItMatters": "Implement regional, departmental, or tenant segmentation without creating separate physical copies of each set."
        },
        {
          "term": "Column mask",
          "definition": "Function that dynamically replaces the displayed value of a column while preserving a type compatible with its contract.",
          "whyItMatters": "Allows sharing of non-sensitive data and structure without exposing the original value to unauthorized readers."
        },
        {
          "term": "Secure optimization",
          "definition": "Principle by which the engine limits plan transformations if they could reveal information protected by filters or masks.",
          "whyItMatters": "Explains why a correct policy can change pushdown or performance and requires specific measurement."
        }
      ],
      "workedScenario": {
        "situation": "A global payroll table should show only the analyst's country and mask salary except for compensation-admins; current aggregated queries depend on pruning by country.",
        "reasoning": [
          "Design a deterministic row filter for entitlement and a typed mask for salary, with managed groups and explicit treatment of identities without mapping.",
          "Apply using ABAC in a pilot scope and test rows, values, nulls, joins, aggregates, DML allowed and any runtime limitations.",
          "Compare pruned and P95 files, simplify functions if they degrade the plan, and document a dynamic view only for incompatible consumers."
        ],
        "outcome": "Each audience gets exactly authorized rows and values, negative tests block inference, and performance stays within SLO with a central policy."
      }
    },
    "keyPoints": [
      "Row filter controls rows; column mask transforms visible values.",
      "The mask type must be compatible with the column.",
      "Complex policies can affect DML, pushdown, and external clients."
    ],
    "decisions": [
      "Row filter controls rows; column mask transforms visible values.",
      "The mask type must be compatible with the column.",
      "Complex policies can affect DML, pushdown, and external clients."
    ],
    "example": {
      "title": "Regional filter and email mask per table",
      "note": "The EU fixed filter is a laboratory example; in production it maps identity to region using a governed authorization table."
    },
    "pitfalls": [
      "Implement a mask that changes STRING to an incompatible type.",
      "Use a non-deterministic UDF or with complex subqueries and block DML as necessary."
    ],
    "examDecision": "Use simple functions and centralize with ABAC at scale; validates DML and supported clients before applying the policy broadly.",
    "checkpoint": {
      "question": "What happens to a row if the row filter returns FALSE?",
      "answer": "The row is excluded from the result for that user; the base table is not modified."
    }
  },
  "m30-l4": {
    "summary": "Demonstrate who did what using `system.access.audit` and lineage, maintaining separation of duties and restricted access to sensitive telemetry.",
    "explanation": [
      "The audit log system table records account and workspace events with identity, service, action, parameters, and response. Check changes in permissions, tags, policies and access within the region and documented retention. ABAC policy creation, modification, and deletion events are auditable; an alert should filter relevant actions and link to the affected object.",
      "Unity Catalog Lineage captures reads and writes at the table and column level for supported interfaces, and helps analyze the impact of a PII change or flow. It does not replace audit: lineage explains flow, audit explains action/actor. Present redacted views to security and operations; do not distribute entire request parameters without evaluating secrets or personal data."
    ],
    "deepDive": {
      "mentalModel": "Audit answers who tried what, when, from where and with what result; lineage answers which assets a transaction read or wrote when that relationship could be inferred. They are complementary sources, not equivalent. system.access.audit logs access and control events with parameters and responses; Lineage system tables record table- or column-level relationships for captured entities. Lineage has partial coverage by design and the absence of an edge does not demonstrate absence of access. Both sources contain potentially sensitive identities, names, and queries, so their access must be narrower than the dashboard they derive. Useful evidence preserves IDs, timestamps, and granularity without indiscriminately exporting the entire control plane.",
      "mechanics": [
        "Audit logs are enabled as a regional system table for many events and allow filtering service_name, action_name, actor, workspace and time. Lineage tables contain source, target, entity type and metadata that can be linked to query history using available identifiers. A timeline combines events, but avoids turning a one-to-many relationship into duplicate counts. Documented retention and coverage are considered when designing investigations and alerts. Only authorized groups receive SELECT or access via composed views.",
        "An alert on each SELECT generates noise; Grants, policy changes, exports, denied access and sensitive objects are prioritized. Parameters can contain private values ​​and are minimized in views. For an investigation, filters, time zone and query IDs are preserved and inference is marked against fact. Declarative Automation Bundles, formerly Asset Bundles in the blueprint, can version discovery jobs, but do not convert partial lineage into a full source. Separation of duties prevents the same operator from altering policy and deleting evidence."
      ],
      "concepts": [
        {
          "term": "Audit event",
          "definition": "Record of an account or workspace action with actor, operation, time, relevant parameters and observed result.",
          "whyItMatters": "Provides evidence for permission changes, access, deployments, and liability and compliance investigations."
        },
        {
          "term": "Data lineage",
          "definition": "Inferred relationship between source, target, and executing entity assets during a captureable read or write.",
          "whyItMatters": "It helps evaluate impact and traceability, but its partial coverage requires not interpreting absence as negative evidence."
        },
        {
          "term": "Redacted View",
          "definition": "Governed view that exposes only necessary columns and rows of sensitive telemetry for a specific audience.",
          "whyItMatters": "Enables operational observability without delivering full queries, identities, or parameters to all consumers."
        }
      ],
      "workedScenario": {
        "situation": "A mask removed for twenty minutes appears and a sensitive table was consulted; Security needs to know actor, downstream consumers and impact without granting full audit to the entire team.",
        "reasoning": [
          "Filter audit by policy, grant and table in the exact window to identify actor, action, result and statement IDs without assuming causality yet.",
          "Relate query history and available lineage to list reads and destinations, clearly marking uncaptured assets and verifying additional logs.",
          "Share a redacted view with the investigative team, restore policy through a revised process, and preserve evidence with controlled permissions and retention."
        ],
        "outcome": "The organization delineates exposure and downstream chain with traceable evidence, maintains telemetry privacy, and adds a specific alert for future recalls."
      }
    },
    "keyPoints": [
      "Audit answers actor and action; lineage, origin and consumption.",
      "Restrict telemetry columns and rows based on function.",
      "Alert about changes in grants, policies, tags and anomalous accesses."
    ],
    "decisions": [
      "Audit answers actor and action; lineage, origin and consumption.",
      "Restrict telemetry columns and rows based on function.",
      "Alert about changes in grants, policies, tags and anomalous accesses."
    ],
    "example": {
      "title": "Audit permission and policy changes",
      "note": "Validate the real action names of your account and limit the view; `request_params` may contain information that is not needed by the entire team."
    },
    "pitfalls": [
      "Grant access to the full audit log to those who only investigate a catalog.",
      "Interpret absence of lineage of an unsupported API as proof that there was no access."
    ],
    "examDecision": "To investigate permissions use audit; for upstream/downstream impact use lineage; combines both without expanding access unnecessarily.",
    "checkpoint": {
      "question": "Which source would you use to find out who revoked a grant and which one to discover affected dashboards?",
      "answer": "`system.access.audit` for actor/action and Unity Catalog lineage for downstream consumers."
    }
  },
  "m30-l5": {
    "summary": "Integrates privacy with classification, minimization, workspace bindings, retention, and negative access testing.",
    "explanation": [
      "Privacy is not limited to a mask. Classify data, minimize columns, limit retention and separate environments. Workspace bindings restrict which workspaces catalogs, external locations, or storage credentials can be used from; Combined with grants and ABAC they reduce the exposure radius. Managed tables allow Unity Catalog to also control the storage lifecycle.",
      "Test policies from three perspectives: authorized user sees original, restricted user sees mask/filter, and unauthorized principal sees deny. Add path bypass, clones, time travel and shares tests based on current limitations. When shared outside, publish a derived view/table with minification and contract, not the responsive table for convenience."
    ],
    "deepDive": {
      "mentalModel": "Privacy is an end-to-end property, not a mask placed at the end. Start by asking if the data should be collected, for what purpose, for how long, and in which regions; continues with classification, access, minimization, retention, sharing and verifiable deletion. Unity Catalog provides ownership, tags, policies, lineage and workspace bindings, but each control covers a different border. A catalog linked to a workspace limits where it is accessed; ABAC limits what is visible; retention limits how long it persists; none replaces the others. Negative tests show that unauthorized identities, workspaces, and consumers fail. The design also preserves investigative capabilities without replicating PII in logs or cost tags.",
      "mechanics": [
        "The classification applies governed tags and ownership; grants and ABAC implement access; workspace-catalog bindings restrict catalogs, external locations, or credentials to authorized workspaces. The tables define retention and purge processes compatible with requirements and consumers. Dynamic views or curated sharing minimize columns before crossing borders. Audit and lineage verify usage within their coverage. Current automation is versioned with Declarative Automation Bundles, which the blueprint still calls Asset Bundles, and separates public configuration from secrets.",
        "Keeping everything just in case increases exposure and cost; Deleting too soon breaks replays, investigations and obligations. Basis and purpose are documented, a retention clock per class is defined, and logical and physical deletion is tested. Synthetic or tokenized data replaces PII in testing. Each release runs negative tests from unauthorized groups and workspaces, in addition to legitimate access. Sharing and federation require residency and egress review; a local policy is not supposed to be applied automatically on the consumer."
      ],
      "concepts": [
        {
          "term": "Minimization",
          "definition": "Principle of collecting, processing and sharing only the attributes and periods necessary for an explicit purpose.",
          "whyItMatters": "Reduces impact of incidents, cost of governance and complexity of complying with erasure, residency and access."
        },
        {
          "term": "Workspace binding",
          "definition": "Restriction that limits certain Unity Catalog objects to an approved set of workspaces within the account.",
          "whyItMatters": "Adds an environment boundary even when an identity has privileges on the governed object."
        },
        {
          "term": "Negative access test",
          "definition": "Automated verification that an identity, workspace, or operation outside the contract receives an effective denial.",
          "whyItMatters": "Demonstrates real controls and detects inheritance, exceptions or bindings that a configuration inspection might miss."
        }
      ],
      "workedScenario": {
        "situation": "A healthcare domain copies full PII to dev to test pipelines, retains tables indefinitely, and shares a view with another region assuming the provider mask will always travel.",
        "reasoning": [
          "Classify purpose and residence, replace dev data with synthetic ones, and link sensitive catalogs only to authorized production workspaces.",
          "Define ABAC, minimum views, retention and purge, and explicitly check which policy is or is not applied to the shared asset and recipient.",
          "Automate negative testing, access auditing, and physical erasure testing, retaining only redacted evidence of compliance."
        ],
        "outcome": "Development no longer contains PII, sharing crosses only approved columns, and the organization can demonstrate isolation, retention, and deletion with repeatable tests."
      }
    },
    "keyPoints": [
      "It combines classification, least privilege, bindings and life cycle.",
      "Includes negative and bypass tests in each policy release.",
      "Share minified products instead of exposing sensitive sources."
    ],
    "decisions": [
      "It combines classification, least privilege, bindings and life cycle.",
      "Includes negative and bypass tests in each policy release.",
      "Share minified products instead of exposing sensitive sources."
    ],
    "example": {
      "title": "Minimized view for analytical consumption",
      "note": "Hashing is not automatic anonymization; evaluates re-identification, salt/key management and actual need for each attribute."
    },
    "pitfalls": [
      "Believing that a mask replaces consent, retention and minimization.",
      "Test only with an administrator and do not verify the restricted user experience."
    ],
    "examDecision": "Design defense in depth and test allow/deny; A correct policy also includes routes, workspaces and shared assets.",
    "checkpoint": {
      "question": "What does a workspace binding add to a Unity Catalog grant?",
      "answer": "Limits which workspaces the object can be accessed from, reducing the scope even if the principal has privileges."
    }
  },
  "m31-l1": {
    "summary": "Distinguish Databricks-to-Databricks OpenSharing from Open-to-Databricks and choose OIDC authentication over long-lived portable credentials.",
    "explanation": [
      "OpenSharing is the evolution of the open exchange historically known as Delta Sharing. Between Databricks metastores, the recipient accesses through native integration and does not need a credentials file. For recipients without Unity Catalog, the open protocol allows Spark, Pandas, Power BI, and other connectors via bearer token or OIDC federation.",
      "Assets are consumed in read-only mode and the provider controls what is added to the share. Prefers OIDC with short tokens when the recipient can federate their identity; Bearer tokens require secure distribution, rotation and revocation. The provider and receiver cloud may differ, but egress, location and residency are still architectural decisions."
    ],
    "deepDive": {
      "mentalModel": "OpenSharing moves governed access to the consumer without first copying the dataset to an intermediary database. The provider registers a read-only asset share and a recipient; The consumer consults updated data using the protocol and authorized credentials. Databricks-to-Databricks leverages Unity Catalog on both ends and can share more asset types across accounts and clouds. Databricks-to-Open serves external tools or platforms and its capabilities depend on the open protocol. Authentication is a separate decision: OIDC federation exchanges recipient identity for short tokens; Bearer tokens are portable and durable credentials with higher turnover and exposure load. Read Sharing does not transfer ownership or magically apply every policy from the provider to the consumer.",
      "mechanics": [
        "A share is a Unity Catalog securable that contains supported tables, views, or other assets; a container represents the consuming organization. In Databricks-to-Databricks, the recipient creates a catalog from the provider and governs internal access. In open flow, clients use profile or OIDC exchange to request data; the provider provides temporary access to files or results according to the protocol. OIDC U2M or M2M uses the consumer's IdP, while a bearer token must be distributed and revoked securely.",
        "OIDC reduces static secrecy and links access to identity, but requires federation and coordinated configuration; bearer token accelerates onboarding of compatible clients, but anyone who obtains it can use it within its scope and validity. The capabilities of views, volumes, history or policies vary by container type. Current matrix, cloud, region and client are checked before promising a feature. Events are audited and revocation is rehearsed; Read-only access does not eliminate egress or residency."
      ],
      "concepts": [
        {
          "term": "Databricks-to-Databricks",
          "definition": "OpenSharing model between Unity Catalog metastores where provider and recipient use Databricks, even in different accounts or clouds.",
          "whyItMatters": "Leverages native identity and governance on both sides and supports richer asset types based on compatibility."
        },
        {
          "term": "Databricks-to-Open",
          "definition": "OpenSharing model for external consumers who access through clients compatible with the open exchange protocol.",
          "whyItMatters": "Expands interoperability, but requires reviewing formats, authentication, and capabilities available outside of the vendor's Unity Catalog."
        },
        {
          "term": "OIDC federation",
          "definition": "Exchange of an identity asserted by the consumer's IdP for short OAuth credentials accepted by Databricks.",
          "whyItMatters": "Avoids distributing long-lived bearer tokens and improves revocation, attribution, and alignment with the identity cycle."
        }
      ],
      "workedScenario": {
        "situation": "A supplier must share sales with a Databricks subsidiary in another cloud and with a regulator using Python; Security prohibits static secrets of one year validity.",
        "reasoning": [
          "Classify each container: Databricks-to-Databricks for the subsidiary and Databricks-to-Open for the Python client, verifying compatible assets and formats.",
          "Configure OIDC M2M with separate identities, minimum claims and short expiration, avoiding reusing a portable credential between organizations.",
          "Test read, deny, audit, revocation, and residence in both flows before activating continuous access to the production share."
        ],
        "outcome": "Both consumers receive read-only data using the appropriate model, without bearer durable tokens, and each access can be attributed and revoked independently."
      }
    },
    "keyPoints": [
      "Databricks-to-Databricks avoids exchanging credential files.",
      "OIDC reduces risk against long bearer tokens.",
      "Sharing is read-only and does not necessarily copy the data to the receiver."
    ],
    "decisions": [
      "Databricks-to-Databricks avoids exchanging credential files.",
      "OIDC reduces risk against long bearer tokens.",
      "Sharing is read-only and does not necessarily copy the data to the receiver."
    ],
    "example": {
      "title": "Create a share and add a table",
      "note": "Before assigning a recipient, review columns, shared history, region, and data contract."
    },
    "pitfalls": [
      "Send a bearer token by email or save it to a shared notebook.",
      "Assume read-only eliminates egress cost or re-identification risk."
    ],
    "examDecision": "Use Databricks-to-Databricks when both sides have UC; for open clients, prefers OIDC and governs container lifecycle.",
    "checkpoint": {
      "question": "What security advantage does OIDC offer over a durable bearer token?",
      "answer": "Exchange federated identity for short-lived OAuth credentials, reducing distribution and exposure of persistent secrets."
    }
  },
  "m31-l2": {
    "summary": "Publish a minimal data product using shares, views, and containers with ownership, contract, and rehearsed revocation.",
    "explanation": [
      "The provider creates a share, adds tables, views, or other supported assets, and grants access to a recipient. A shared view can minimize columns and filter data based on contract, but its capabilities and cost depend on the sharing model. The owner of the share must be an operating group and the changes must pass review just like a public API.",
      "Version schema and communicate breaking changes. Monitor access, establish agreement expiration date and test revocation. Don't share the bronze table for convenience: create a stable, documented layer without internal fields. If the receiver needs to write or transform to the source, sharing does not satisfy that read-only requirement."
    ],
    "deepDive": {
      "mentalModel": "A share should be a minimal, contractual data product, not an entire catalog exposed for convenience. The provider preserves internal tables, transformations and PII; Publish only stable, documented, audience-appropriate assets, often using views that set columns and semantics. The recipient obtains access to the share, not ownership over the source objects, and can delegate reading internally according to its model. Adding or removing assets changes the contract and requires versioning or communication. The revocation is part of the initial design: it must be known who can withdraw the recipient or share, how long it takes to take effect, and what legitimate copies the consumer has already created.",
      "mechanics": [
        "The provider creates share, adds compatible tables or views, and grants SELECT or share permissions according to the flow; then creates and authorizes recipients. A shared view can cast, rename, and filter, but its dependencies and policies have specific requirements. The Databricks consumer registers provider and creates a read-only catalog from the share; Objects update as the source changes. Share and object ownership is assigned to operational groups, and audit records creation, modification, and captured queries.",
        "Sharing a base table simplifies and maximizes flexibility, but freezes little contract and can expose future columns. A view stabilizes interface and minimizes, although it adds dependency and can limit features or performance. It is versioned when there are incompatible changes and a transition window is offered. Declarative Automation Bundles, current alias of Asset Bundles in the exam, can version jobs and supported configuration around the product; Even so, sharing and permissions operations are verified in the target."
      ],
      "concepts": [
        {
          "term": "Share",
          "definition": "Unity Catalog Securable that groups an explicit set of read-only assets offered by a provider to authorized recipients.",
          "whyItMatters": "Defines the revocable and auditable boundary of the shared product without transferring ownership of the underlying storage."
        },
        {
          "term": "Recipient",
          "definition": "Registered entity representing a consuming organization and its authentication method for accessing granted shares.",
          "whyItMatters": "It separates consumers, credentials, and revocation, avoiding a shared identity whose use cannot be attributed."
        },
        {
          "term": "Shared contract",
          "definition": "Versioned commitment to schema, meaning, freshness, compatibility and change process of published assets.",
          "whyItMatters": "It allows consumers to depend on the product without being exposed to every internal detail or future column."
        }
      ],
      "workedScenario": {
        "situation": "A partner receives a complete gold board; a new confidential margin column appears automatically and another change renames customer_segment, breaking your pipeline without warning.",
        "reasoning": [
          "Replace the base table with a minimal view with approved columns and schema contract, validating that the container type supports that form.",
          "Publish a new version for the rename, maintain transition and communicate deprecation with consumption metrics and an agreed date.",
          "Test revoking a test container, check audit, and assign ownership of the share to a stable group with emergency runbook."
        ],
        "outcome": "The partner receives a stable interface without confidentiality margin, incompatible changes follow a versioning cycle and revocation is no longer an improvised procedure."
      }
    },
    "keyPoints": [
      "Share a stable contract, not a mutable internal table.",
      "Ownership and revocation are part of the product.",
      "Read-only does not cover cases that require remote writing."
    ],
    "decisions": [
      "Share a stable contract, not a mutable internal table.",
      "Ownership and revocation are part of the product.",
      "Read-only does not cover cases that require remote writing."
    ],
    "example": {
      "title": "Minimized view for a partner",
      "note": "Check current requirements for view sharing and who pays for the associated compute; Try the result as a container."
    },
    "pitfalls": [
      "Share internal fields and trust the receiver not to use them.",
      "Change names/types without version or notice because the share is still accessible."
    ],
    "examDecision": "Expose a minimized and versioned product view or table; sharing is an external contract, not a shortcut to silver/bronze.",
    "checkpoint": {
      "question": "Why share a stable view instead of the operational table?",
      "answer": "It allows minimizing and decoupling the external contract from internal columns and changes."
    }
  },
  "m31-l3": {
    "summary": "Governs sharing with audit, residency, egress, rotation, and policy compatibility before onboarding a consumer.",
    "explanation": [
      "The provider retains control and can revoke the recipient or withdraw assets. Register owner, purpose, region, legal basis, classification, protocol and authentication method. Audit actions of shares/recipients and accesses according to the available system tables. If you use bearer credentials, store them as secrets, rotate with overlap, and destroy old copies.",
      "Row filters/masks and ABAC have specific limitations when sharing; do not assume that a policy applied to the source is reproduced the same at the receiver. Test the share with a real identity of the recipient. Model egress cloud and foreign compute in cost, especially for views, materialized views, streaming tables or federated data."
    ],
    "deepDive": {
      "mentalModel": "Sharing crosses an organizational boundary even if the data remains in the provider's storage. Each query can generate transfer, temporary credentials and access events; That is why the evaluation covers residency, egress, identity, retention and compatibility, not just a GRANT. Provider and recipient have different responsibilities: the former decides what exposes and monitors requests; the second governs who can read the received catalog and what copies it derives. A provider ABAC policy may have limitations or not govern the receiving side as imagined; the consumer needs his own controls. Bearer tokens are rotated and distributed carefully, OIDC is preferred when available, and all onboarding includes an actual proof of revocation.",
      "mechanics": [
        "system.access.audit logs OpenSharing events for providers and recipients when system tables are enabled. Depending on the mode, a read may appear as a table lookup or temporary credential generation; request_params and response help identify container and object. Cloud tokens or signed URLs grant limited access, but egress occurs from the data location to the client. Shares are read-only, although the recipient can materialize results under its own governance and retention.",
        "Residence is evaluated with metastore, storage, and consumer region; A possible technical connection does not equate to legal approval. Egress and scan patterns are budgeted, columns and periods are minimized, and abnormal volumes are alerted. Logs contain identity and routes, so a redacted view serves operations. If bearer token is used, expiration, channel and rotation are set; If OIDC, claims are proven, revocation in IdP and ruling closed. The recipient's policies are independently validated."
      ],
      "concepts": [
        {
          "term": "egress",
          "definition": "Data transfer from the region or storage provider to another network, region, cloud, or external consumer.",
          "whyItMatters": "It may introduce cost, latency, and residency restrictions even if OpenSharing prevents a prior managed copy."
        },
        {
          "term": "Temporary cloud credential",
          "definition": "Credential of reduced scope and duration generated for a client to read only authorized data from a share.",
          "whyItMatters": "It limits exposure to permanent keys, but their generation and use still require auditing and controls."
        },
        {
          "term": "Shared responsibility",
          "definition": "Division of obligations where provider governs publication and recipient governs access and derivatives within your organization.",
          "whyItMatters": "Avoid assuming that an origin policy automatically protects copies, users, or retention on the consumer."
        }
      ],
      "workedScenario": {
        "situation": "A European recipient queries 40TB of US storage daily, creates local copies, and uses a bearer token shared by twelve analysts without individual attribution.",
        "reasoning": [
          "Measure egress and review residence, contract and real need for columns and windows before optimizing only the transfer speed.",
          "Migrate to OIDC or separate identities, minimize sharing and agree recipient controls over copies, retention and internal users.",
          "Configure audit queries and volume alerts, and test revocation on both the provider and consumer IdP."
        ],
        "outcome": "The transfer goes down substantially, each access is attributed, and both parties document residency and derivatives rather than relying on an undefined collective token."
      }
    },
    "keyPoints": [
      "Test experience and restrictions from the receiving end.",
      "Includes egress, compute and remote source in FinOps share.",
      "Rehearse rotation and revocation before the incident."
    ],
    "decisions": [
      "Test experience and restrictions from the receiving end.",
      "Includes egress, compute and remote source in FinOps share.",
      "Rehearse rotation and revocation before the incident."
    ],
    "example": {
      "title": "Shared Object Inventory",
      "note": "Complement the inventory with audit logs and the recipient contract; `SHOW` alone does not describe the legal basis or cost."
    },
    "pitfalls": [
      "Assume that a mask of the base table always remains the same in OpenSharing.",
      "Create containers without owner or revision date and accumulate orphan access."
    ],
    "examDecision": "Before sharing, validate effective policy, residence, authentication and cost from the recipient; then monitors and recertifies.",
    "checkpoint": {
      "question": "What test best demonstrates that a revocation works?",
      "answer": "Revoke in a controlled environment and verify from the identity of the recipient that you can no longer list or query the asset."
    }
  },
  "m31-l4": {
    "summary": "Differentiate query federation from catalog federation and understand where each part is executed, what is pushed, and why both are read-only.",
    "explanation": [
      "Lakehouse Federation offers governed access through foreign catalogs. Query federation connects relational bases via JDBC: Databricks pushes compatible filters/aggregations and part of the query is executed on the remote system. Catalog federation connects external catalogs such as Hive Metastore, AWS Glue or compatible platforms and Databricks reads data from object storage with its own compute.",
      "Both paths are read-only and serve exploration, BI or incremental migration, they do not replace an ingest for repeated intensive loads. Check pushdown with `EXPLAIN`, network latency, origin limits and concurrency. A query that extracts millions of rows without a filter can overwhelm the operational database even if the Databricks warehouse has capacity."
    ],
    "deepDive": {
      "mentalModel": "Lakehouse Federation queries data where it lives, but there are two different architectures. Query federation connects via JDBC to an operational base; part of the plan is pushed to the remote engine and the rest is executed in Databricks. Catalog federation integrates metadata from an external catalog and Databricks directly reads its object storage files with its own compute. Both are presented as foreign catalogs governed by Unity Catalog and are normally read-only, but the place of execution, cost and limits do not coincide. Pushdown is not all or nothing: it depends on the connector and operation. A query that returns too many rows can overwhelm the remote database or an executor even though the SQL appears simple.",
      "mechanics": [
        "Query federation creates a connection with credentials and a foreign catalog that reflects the database. Databricks translates supported filters, projections or aggregations to remote SQL and receives results over JDBC connections; non-pushed operations are completed on Databricks. Catalog federation obtains metadata from systems such as Hive Metastore or Glue, but executors directly read files accessible in storage. Unity Catalog applies permissions on foreign catalogs and records lineage when it can infer it.",
        "Query federation takes advantage of remote computing and serves exploration, but competes with OLTP, inherits connection limits, does not use the same caches, and can return a large stream to a task. Catalog federation avoids JDBC for object storage data, but requires supported credentials, formats, and catalog. Neither option is a general write path or CDC. Pushdown is tested using profile and remote loading, latency, consistency, egress and permissions. For high recurring volume, managed ingestion usually offers better isolation."
      ],
      "concepts": [
        {
          "term": "Query federation",
          "definition": "Read-only access to external databases through JDBC, with pushdown supported and execution distributed between remote system and Databricks.",
          "whyItMatters": "It allows fast on-site analysis, but can shift load to an operational system and limit throughput."
        },
        {
          "term": "Catalog federation",
          "definition": "Integration of metadata from an external catalog while Databricks directly reads the underlying files with its own compute.",
          "whyItMatters": "Facilitates hybrid models and migrations without JDBC, as long as storage, credentials and formats are supported."
        },
        {
          "term": "Pushdown",
          "definition": "Translation of filters, projections or aggregations to run on the source before transferring the result to Databricks.",
          "whyItMatters": "Reduces motion when supported, but must be checked because unsupported operators run locally."
        }
      ],
      "workedScenario": {
        "situation": "A federated analyst queries PostgreSQL and matches 900 million orders with Delta; the filter uses a non-push function and the OLTP base reaches connection limits during business hours.",
        "reasoning": [
          "Examine profile and remote SQL to confirm what is pushed, how much result crosses JDBC, and how the query affects CPU and operational connections.",
          "Rephrase compatible filters for immediate exploration and limit warehouse, concurrency and schedule while evaluating the recurring pattern.",
          "Move the stable case to incremental ingestion or CDC with Delta table, keeping federation only for validation and small ad hoc queries."
        ],
        "outcome": "Operational foundation regains margin, recurring analytics gets predictable SLA on Delta, and federation retains its quick access feature without becoming shadow ETL."
      }
    },
    "keyPoints": [
      "Query federation uses JDBC and remote compute with pushdown.",
      "Catalog federation reads object storage using compute Databricks.",
      "For frequent transformation or writing, ingest and materialize in lakehouse."
    ],
    "decisions": [
      "Query federation uses JDBC and remote compute with pushdown.",
      "Catalog federation reads object storage using compute Databricks.",
      "For frequent transformation or writing, ingest and materialize in lakehouse."
    ],
    "example": {
      "title": "Create a foreign catalog over an existing connection",
      "note": "The connection must use secrets and private/allowed network; reviews the plan to check which predicates are pushed."
    },
    "pitfalls": [
      "Treat a foreign catalog as an ETL writable target.",
      "Launch full scans against an OLTP database during peak load hours."
    ],
    "examDecision": "Use federation for read-only and exploratory access with pushdown; ingested when use is repetitive, intensive, transformational or requires independent SLA.",
    "checkpoint": {
      "question": "Where is a query federation query executed?",
      "answer": "Part in Databricks and part in the remote base through JDBC pushdown, according to supported operations."
    }
  },
  "m31-l5": {
    "summary": "Select sharing, federation, or ingestion by comparing address, frequency, freshness, writing, governance, cost, and operational isolation.",
    "explanation": [
      "Sharing publishes a product governed towards external consumers; federation consults an external source on site; ingestion copies changes to the lakehouse for transformation and own SLAs. If a partner needs to read a curated table, sharing prevents an export. If an analyst scans PostgreSQL a few times, federation reduces time-to-value. If hundreds of jobs add that base every hour, it ingests incrementally.",
      "Interoperability does not eliminate contracts. Documents types, time zones, delete semantics, limits and ownership. Consider Iceberg REST Catalog or other protocols when external clients must read governed tables directly, always contrasting support for Delta/ABAC features. Design an exit: how to revoke, materialize, or migrate without breaking consumers."
    ],
    "deepDive": {
      "mentalModel": "Sharing, federation and ingestion address different directions. Sharing publishes from a provider to read-only consumers and keeps the product at source. Federation allows Databricks to query an external system on-premise, typically for exploration or hybrid modeling. Ingestion moves changes to Delta for Databricks to monitor downstream performance, history, quality, and writing. The decision is formulated with direction, frequency, freshness, volume, write needs, governance, egress and operational isolation. The lower apparent latency can hide load on OLTP; the most robust copy may violate residency; sharing may be perfect for collaboration but not for updating the provider's system. No label replaces a requirements matrix and a failure test.",
      "mechanics": [
        "OpenSharing uses shares and containers and reflects read-only updates in almost real time according to asset and client. Federation creates connections and foreign catalogs and executes reads to source or external storage. Batch, query-based or CDC ingestion creates a governed copy with its own checkpoint, schema and SLA. All three can appear under Unity Catalog, but ownership and allowed operations differ. The chosen pattern determines where expectations, retention, lineage, cost and recovery are applied.",
        "Federation avoids initial pipeline, but each query depends on external availability and performance. Ingestion adds storage and delay, but isolates consumers and supports transformations, CDFs, and replays. Sharing prevents each recipient from operating source connectors, but requires contract and authentication. Mandatory requirements are scored before cost, tested with volume and actual failure, and output is documented. Automated configuration uses current Declarative Automation Bundles; Asset Bundles is the alias that may appear in the Professional blueprint."
      ],
      "concepts": [
        {
          "term": "Access address",
          "definition": "Relationship between who owns the data, who initiates the query and where the resulting state should materialize.",
          "whyItMatters": "Distinguishes publishing to consumers, querying an external source, and copying data for controlled processing."
        },
        {
          "term": "Operational isolation",
          "definition": "Degree to which failures, loads, or changes in one system can affect availability and performance of the other.",
          "whyItMatters": "A federated query can impact OLTP, while an ingested copy decouples both in exchange for freshness."
        },
        {
          "term": "Effective freshness",
          "definition": "Observable age of usable data after transportation, processing, validation and availability to the consumer.",
          "whyItMatters": "Avoid comparing only trigger frequency and reveal delays in quality, backlog or downstream publication."
        }
      ],
      "workedScenario": {
        "situation": "A company needs to explore CRM tomorrow, feed hourly models with 5 TB daily and share curated results with three partners who should not access the CRM.",
        "reasoning": [
          "Use query federation temporarily for selective exploration, with limits that protect CRM and without confusing it with the high-volume solution.",
          "Implement incremental ingestion or CDC towards Delta for models, quality, history and isolation with verifiable hourly freshness.",
          "Only publish results curated through OpenSharing with separate containers, contracts, OIDC and auditing for each consumer."
        ],
        "outcome": "Each need uses the consistent pattern with direction and loading: rapid discovery, isolated processing, and governed distribution without exposing the operational system."
      }
    },
    "keyPoints": [
      "Sharing serves publishing; federation, on-site consultation; ingestion, controlled processing.",
      "The frequency and burden on the origin usually decide between federation and intake.",
      "Each employer needs contract, owner, cost and exit strategy."
    ],
    "decisions": [
      "Sharing serves publishing; federation, on-site consultation; ingestion, controlled processing.",
      "The frequency and burden on the origin usually decide between federation and intake.",
      "Each employer needs contract, owner, cost and exit strategy."
    ],
    "example": {
      "title": "Interoperability Decision Matrix",
      "note": "A useful decision also preserves the reason for rejected alternatives and the review date."
    },
    "pitfalls": [
      "Use federation for a heavy time transformation and move the neck to OLTP.",
      "Export files with static credentials when OpenSharing covers the contract."
    ],
    "examDecision": "Choose by direction and pattern: curated outbound → sharing; external occasional reading → federation; recurrent/independent processing → ingestion.",
    "checkpoint": {
      "question": "Which signal indicates that a federated query should be ingested?",
      "answer": "It is frequent, moves a lot of data, loads the source, or requires transformations/SLAs that should not depend on the remote system."
    }
  },
  "m32-l1": {
    "summary": "Turn ambiguous requirements into a defensible architecture with SLOs, contracts, ownership and traceability to Professional domains.",
    "explanation": [
      "The final project begins with decisions, not products. Defines volume, latency, freshness, quality, retention, RPO/RTO, consumers, classification, regions and budget. Then map each requirement to a capability: Auto Loader/Lakeflow Connect for ingestion, declarative pipelines for transformation, Jobs for orchestration, Unity Catalog for governance, and system tables for operation.",
      "Documents rejected alternatives and conditions of change. A Professional architecture is not one that uses more services, but rather one that minimizes ambiguous states and responsibilities. Each table, checkpoint, job, policy and alert has an owner; each SLO has a measurable signal and a runbook. It also maps evidence to the domains of the blueprint without turning it into memorization."
    ],
    "deepDive": {
      "mentalModel": "A Professional architecture is a chain of traceable decisions, not a collage of services. Each requirement is first transformed into a measurable property: freshness in SLO, accuracy in reconciliations, security in principals and policies, recovery in RPO and RTO, and cost in unit of value. Components that satisfy those properties are then assigned and tradeoffs and failures are documented. Ownership and contracts define who is responsible when the system degrades. Certification evaluates choosing the most appropriate option under constraints, so a defensible response connects requirement, mechanism and evidence. If two solutions work, the one that uses managed capabilities, least privilege, idempotence, and lower operational overhead without violating an explicit condition wins.",
      "mechanics": [
        "Design begins with sources, volume, variability, consumers and regulatory limits; draw data flow and trust boundaries. For each stage declare input, output, schema, key, temporal semantics, SLA and owner. The SLOs are accompanied by queryable indicators and alerts; RPO and RTO are linked to checkpoints, retention, backfills and runbooks. The decision matrix records why Lakeflow Connect, Auto Loader, Spark Declarative Pipelines, Jobs, Delta, Unity Catalog, or sharing are used, rather than listing them without a role.",
        "The Professional blueprint of November 30, 2025 retains terms from its date: Asset Bundles corresponds today to Declarative Automation Bundles, renamed in March 2026. Declarative project technology and reasoning are equivalent for exam. Likewise, the design checks for current names and limits without assuming that a feature preview is universal. An architecture decision record includes a discarded alternative, cost, risk, signal of success, and condition that would force the choice to be reviewed."
      ],
      "concepts": [
        {
          "term": "ONLY",
          "definition": "Quantitative reliability or performance objective, such as freshness, availability or latency, measured during an agreed window.",
          "whyItMatters": "Turn ambiguous expectations into criteria that guide architecture, alerts, capacity, and decisions during incidents."
        },
        {
          "term": "Trust boundary",
          "definition": "Border where identity, administrative control, residence or level of trust of data and operations change.",
          "whyItMatters": "It forces you to design authentication, minimization, encryption, and auditing exactly where risk increases."
        },
        {
          "term": "Architecture decision record",
          "definition": "Brief record of the context, decision, alternatives, tradeoffs and signals that will justify reviewing an architectural choice.",
          "whyItMatters": "It makes the design defensible and avoids losing reasoning when requirements, equipment or platform capabilities change."
        }
      ],
      "workedScenario": {
        "situation": "An insurer asks for fraud in less than five minutes, exact daily financial close, European residency, two-hour recovery and attributable cost per policy, but the brief only says to use lakehouse.",
        "reasoning": [
          "Convert each phrase into SLO, RPO/RTO, trust boundaries, contracts and cost metrics, assigning owner and consumer to each intermediate product.",
          "Compare streaming, batch, and requirement-managed capabilities, documenting where state, idempotence, isolation, and a backfill path are needed.",
          "Create ADRs and acceptance tests that measure freshness, reconciliation, residency, recovery and cost before approving the proposed architecture."
        ],
        "outcome": "The result ceases to be an ornamental diagram and becomes a verifiable system whose selection of components can be justified by operation, safety, business and examination."
      }
    },
    "keyPoints": [
      "Quantified requirements precede the selection of services.",
      "Each component needs state, owner, SLO and recovery strategy.",
      "Register alternatives and triggers that would force you to review the decision."
    ],
    "decisions": [
      "Quantified requirements precede the selection of services.",
      "Each component needs state, owner, SLO and recovery strategy.",
      "Register alternatives and triggers that would force you to review the decision."
    ],
    "example": {
      "title": "Architecture contract and SLO",
      "note": "Each value must link to a measurement and a response; an SLO without observability is just an aspiration."
    },
    "pitfalls": [
      "Choose components before clarifying latency, volume and ownership.",
      "Confusing platform high availability with application idempotence and recovery."
    ],
    "examDecision": "Faced with a complex scenario, first identify the dominant requirement and state that must be protected; only then select the component.",
    "checkpoint": {
      "question": "What turns a 'near real-time' requirement into a testable architectural decision?",
      "answer": "A quantified freshness SLO, its signal, measurement window and response to non-compliance."
    }
  },
  "m32-l2": {
    "summary": "Design an idempotent end-to-end flow from ingestion and CDC to curated models, with tested backfill and schema evolution.",
    "explanation": [
      "Incremental ingestion preserves progress via checkpoint or connector state; bronze retains enough raw facts for replay; silver applies contracts, deduplication and CDC; gold serves consumer models. Each write uses a known business key and retry semantics. Late data, deletes, and schema changes have an explicit policy, not accidental behavior.",
      "Test replay and backfill before production. A live pipeline and a backfill should not compete for the same rank without coordination. Uses `MERGE` or the current `AUTO CDC` API — `APPLY CHANGES` in legacy code— depending on the tool and sequence order, preserves quarantine for breaches, and reconciles counts/amount between layers. Version incompatible changes to the contract."
    ],
    "deepDive": {
      "mentalModel": "A correct end-to-end flow maintains identity and change order from the source to the curated model. Batch and CDC can overlap during bootstrap; schema can evolve; Events may repeat themselves or arrive late. Idempotence is designed with business keys, sequence, checkpoints and declarative operations such as AUTO CDC or deterministic MERGE, not relying on an execution to occur only once. Bronze preserves evidence and metadata of ingestion; silver applies contract, deduplication and changes; gold publishes consumer semantics. A backfill uses the same contract or a compatible route, with interval, snapshot, and version recorded. Convergence is demonstrated by reconciliation, not by the absence of exceptions.",
      "mechanics": [
        "Auto Loader or Connect maintains ingestion progress and schema according to configuration; Spark Declarative Pipelines can declare streaming tables, expectations, and AUTO CDC to apply ordered changes. Delta commits make each table atomic, while keys and sequence_by determine how to resolve repetitions and out-of-order. CDF delivers downstream changes when properly enabled and retained. Jobs orchestrates bootstrap, streaming, validations and publishing, passing explicit parameters instead of hidden state.",
        "Allowing automatic evolution of every column can propagate errors; blocking all schema stops compatible changes. Policy is defined per layer and quarantine for deviations. SCD Type 1 overwrites state; Type 2 preserves intervals and requires tiebreaking and current exclusivity. Concurrent backfill with stream can collide or duplicate if it does not share keys and semantics. Full replay, duplicate event, late arrival, schema change and failure between layers are tested, verifying counts, sums and versions."
      ],
      "concepts": [
        {
          "term": "Convergence",
          "definition": "Property by which normal processing, retries, and backfills reach the same correct state for an equivalent logical input.",
          "whyItMatters": "It demonstrates real idempotence and allows recovery without depending on a perfect sequence of executions."
        },
        {
          "term": "Sequence by",
          "definition": "Command expression used by a CDC operation to decide which change is next for each business key.",
          "whyItMatters": "Resolves out-of-order arrivals deterministically and prevents an old event from overwriting recent state."
        },
        {
          "term": "Bootstrap",
          "definition": "Initial loading that establishes a complete state before applying continuous incremental changes from a coordinated boundary.",
          "whyItMatters": "An overlap or gap between snapshot and CDC creates duplicates or historical loss that is difficult to detect later."
        }
      ],
      "workedScenario": {
        "situation": "12 TB of clients are migrated from PostgreSQL: the snapshot takes six hours while CDC continues, duplicate updates arrive, and a new column appears before bootstrap finishes.",
        "reasoning": [
          "Set a consistent boundary between snapshot and log, keep source sequence and ingestion metadata in bronze, and define the schema policy for the new column.",
          "Apply AUTO CDC or deterministic MERGE by customer_id and sequence in silver, with quarantine for incompatible changes and explicit SCD.",
          "Play snapshot plus CDC on an isolated target and reconcile keys, current, intervals and totals before promoting the same flow."
        ],
        "outcome": "Bootstrap and incremental converge without gaps or duplicates, the new column follows a controlled contract, and future replays produce exactly the same curated state."
      }
    },
    "keyPoints": [
      "Checkpoint plus reproducible bronze allow recovery without returning to the origin when retention allows it.",
      "CDC needs key, sequence and semantics of deletes.",
      "Backfill is designed and tested as a first-class operating mode."
    ],
    "decisions": [
      "Checkpoint plus reproducible bronze allow recovery without returning to the origin when retention allows it.",
      "CDC needs key, sequence and semantics of deletes.",
      "Backfill is designed and tested as a first-class operating mode."
    ],
    "example": {
      "title": "Idempotent MERGE of CDC orders",
      "note": "Pre-deduplicates multiple events per key/sequence and defines what to do with out-of-order events."
    },
    "pitfalls": [
      "Clear checkpoint to force a replay without checking retention and side effects.",
      "Apply CDC without a deterministic sequence and overwrite a new state with a late event."
    ],
    "examDecision": "For the CDC, it requires code and order; for recovery, preserves bronze/checkpoint and executes bounded and idempotent backfills.",
    "checkpoint": {
      "question": "What three minimum elements does a deterministic CDC need?",
      "answer": "Business key, column/sequence criteria and explicit semantics for inserts, updates and deletes."
    }
  },
  "m32-l3": {
    "summary": "Operate the product with expectations, event logs, system tables, lineage, alerts and runbooks that cover data and platform.",
    "explanation": [
      "Observability is designed in layers: product freshness and completeness, record quality, pipeline status/duration/retries, query profiles and cost. Expectations can fail, discard or log depending on severity; pipeline event logs explain updates and quality; system tables add jobs, queries, billing, audit and lineage.",
      "An alert must be actionable: it includes threshold, window, owner, context and link to the runbook. Avoid alert fatigue by grouping symptoms of the same failure. In recovery, it validates downstream and not just the run. Use lineage for impact, audit for actor/change and Query Profile/Spark UI for performance. Try RTO with game days."
    ],
    "deepDive": {
      "mentalModel": "Operating a data product requires looking at platform and meaning. A green task only indicates that the code has finished; it does not demonstrate freshness, completeness or accuracy. Expectations measure rules in the flow and can warn, discard or fail depending on severity. The pipeline event log explains updates and quality; system tables provide history of jobs, queries, compute, cost, audit and lineage; business tables provide reconciliations. Alerts are linked to an SLO and a runbook, with owner and initial action. The design also assumes that a source of observability may be partial or delayed, so it combines signals and maintains common IDs to reconstruct an incident.",
      "mechanics": [
        "Each stage emits input, output, quarantine, delay and version metrics. Expectations encode local invariants and the event log allows you to consult results by update. Lakeflow Jobs offers statuses, duration, retries and task lineage; system tables support historical trends. Query Profile or Spark UI provides details of a specific execution. Alerts about backlog, budget error, duplicates or cost include run, table and link to the runbook. Sensitive telemetry is published through redacted views and minimal access.",
        "Alerting every failure produces fatigue; Hiding quality warnings lets the product degrade silently. Severities are defined: an invalid row can go to quarantine, a financial reconciliation must block publication. The runbook specifies diagnostics, reversible mitigation, recovery criteria, and escalation. Game days of source delay, schema break, skew and permission revoked are executed. The dashboards measure error budget and trend, they do not replace the periodic and recurring exercise of the procedure."
      ],
      "concepts": [
        {
          "term": "Expectation",
          "definition": "Declarative quality rule associated with a dataset that records or applies an action when a row fails to comply.",
          "whyItMatters": "Convert data contracts into telemetry and control during processing, before publishing faulty results."
        },
        {
          "term": "Budget error",
          "definition": "Tolerated amount of non-compliance with an SLO during a window, derived from the agreed reliability target.",
          "whyItMatters": "It balances delivery and stability and provides an objective signal to prioritize reliability work."
        },
        {
          "term": "game day",
          "definition": "Controlled exercise that introduces a predicted failure to test alerts, roles, runbooks, and actual recoverability.",
          "whyItMatters": "Detects incomplete procedures before an incident and transforms unexecuted documentation into operational evidence."
        }
      ],
      "workedScenario": {
        "situation": "Job finishes successfully for a week, but source stopped shipping a region and gold posts 18% less sales; There is no alert because only task status is monitored.",
        "reasoning": [
          "Define expectation and reconciliation by region, freshness and volume, with a seasonal baseline to avoid confusing a real drop in business with technical absence.",
          "Query event log, runs and lineage by common IDs, block financial publishing and activate an absent source runbook and idempotent backfill.",
          "Add alert linked to the SLO and execute a game day that repeats regional loss, validating communication, recovery and closure of the budget error."
        ],
        "outcome": "The platform detects absence before publishing, the backfill restores the region without duplicates and the operation demonstrates recovery even if all tasks had been green."
      }
    },
    "keyPoints": [
      "Measure product, data, execution and cost separately.",
      "Each alert leads to a specific decision and an owner.",
      "Test recovery and RTO; Don't just rely on documentation."
    ],
    "decisions": [
      "Measure product, data, execution and cost separately.",
      "Each alert leads to a specific decision and an owner.",
      "Test recovery and RTO; Don't just rely on documentation."
    ],
    "example": {
      "title": "Consumable freshness indicator for alerts",
      "note": "Distinguishes legitimate absence of stopped pipeline events; combines freshness with sign of origin and business calendar."
    },
    "pitfalls": [
      "Alert for each failed task even if the automatic retry recovers within the SLO.",
      "Declare recovery when you see a green run without measuring freshness, duplicates and consumers."
    ],
    "examDecision": "Choose the signal that represents impact to the consumer and link it with technical telemetry for diagnosis; Don't alert just because of internal noise.",
    "checkpoint": {
      "question": "What differentiates a product metric from an execution metric?",
      "answer": "The first measures the result for the consumer -for example freshness; The second describes the mechanism—duration, status or retries of the job."
    }
  },
  "m32-l4": {
    "summary": "Integrate security, privacy and FinOps into the design: service identities, ABAC, minimized data and cost per unit of value.",
    "explanation": [
      "Each job runs as a primary service with least privileges; CI deploys with another identity. Unity Catalog provides groups, grants, governed tags, ABAC, masks and audit. Classify before sharing and restrict workspaces/locations. Secrets are referenced from scopes or managed mechanisms, never from notebooks, tags or versioned YAML.",
      "The cost is attributed using tags/policies and `system.billing.usage`; compares cost per million orders and per SLO fulfilled. Serverless reduces management, but does not eliminate inefficient queries. Predictive optimization, Photon and liquid clustering are enabled where the workload justifies it and are validated with profiles. The budget includes retries, backfills, egress and sharing/federation."
    ],
    "deepDive": {
      "mentalModel": "Security, privacy and FinOps are architectural constraints, not subsequent revisions. The service identity determines who executes; Unity Catalog and ABAC determine which objects and values ​​you can use; Minimization and retention determine what data exists; bindings and sharing determine where they circulate; system.billing.usage and metadata determine who pays. These decisions interact: a complex mask can affect performance, a copy to optimize can violate residency, and a cost tag can leak PII. The Professional design expresses tradeoffs and separates deploy, execution, and consumption identities. Each control has a positive test, a negative test, and an audit flag, and each cost is tied to a unit of value without weakening integrity.",
      "mechanics": [
        "Service principals receive least privileges and secrets through governed mechanisms. Governed tags classify and activate ABAC; row filters and masks limit data in query; workspace bindings restrict environments. OpenSharing uses separate containers and OIDC where appropriate. billing.usage joins jobs, query history and business dimensions to obtain cost per domain or product. The application configuration is deployed with Declarative Automation Bundles, current name of Asset Bundles in the blueprint, using isolated identities and targets.",
        "A single main administrator simplifies demos but eliminates separation of duties. A tag with customer_name improves apparent attribution at the cost of privacy; Non-sensitive IDs and controlled taxonomy are used. Reducing cost by deactivating validations or shortening retention without analyzing recovery is a false optimization. The threat model lists boundaries and abuses; The tests verify denial from incorrect group and workspace, share revocation and billing coverage. Exceptions have owner and expiration."
      ],
      "concepts": [
        {
          "term": "Separation of duties",
          "definition": "Distribute critical capabilities across identities or groups so that no one party controls deployment, access, and auditing entirely alone.",
          "whyItMatters": "It reduces abuse and error, and maintains independence between whoever changes controls and whoever reviews their evidence."
        },
        {
          "term": "Cost per unit of value",
          "definition": "Attributed spend divided by a verifiable business result, such as a successfully processed policy or published table with SLA.",
          "whyItMatters": "Avoid cuts that reduce quality and distinguish useful growth from a regression in operational efficiency."
        },
        {
          "term": "Compensatory control",
          "definition": "Alternative measure that reduces a risk when the preferred control is not viable due to a technical or temporal limitation.",
          "whyItMatters": "Allows explicit, evaluable exceptions without pretending the requirement went away or accepting risk without treatment."
        }
      ],
      "workedScenario": {
        "situation": "A pipeline uses a principal owner of the catalog, copies PII to test, tags compute with customer_name and costs 0.04 euros per record, but no one includes errors in the denominator.",
        "reasoning": [
          "Separate deploy and execution principals, replace test data, apply groups, ABAC and bindings, and remove sensitive identifiers from tags.",
          "Combine billing with correct runs and published volume to calculate cost per valid record, showing retries and quarantine as visible waste.",
          "Automate negative tests, audit and budgets in bundle targets, maintaining documented exceptions only where a current capacity does not cover the control."
        ],
        "outcome": "The product reduces privileges and exposure, achieves non-sensitive attribution, and finds that the actual cost per successful record was twice as high, enabling honest optimization."
      }
    },
    "keyPoints": [
      "Separates identity from deploy, run and human consumption.",
      "Classification addresses policies and minimized sharing.",
      "Optimize cost per result, not just gross consumption."
    ],
    "decisions": [
      "Separates identity from deploy, run and human consumption.",
      "Classification addresses policies and minimized sharing.",
      "Optimize cost per result, not just gross consumption."
    ],
    "example": {
      "title": "Operating cost attributed by product",
      "note": "Combine effective prices and a metric of processed orders to convert consumption into unit cost."
    },
    "pitfalls": [
      "Run CI and production with the same primary administrator.",
      "Apply a mask to the table but share a copy without that protection."
    ],
    "examDecision": "Design identity and politics together with data; FinOps and security are architectural requirements, not post-go-live tasks.",
    "checkpoint": {
      "question": "Why is it convenient to separate main CI and execution services?",
      "answer": "CI needs to manage resources; the workload only needs to execute and access data. Separating them reduces privileges and improves auditing."
    }
  },
  "m32-l5": {
    "summary": "Solve the Professional simulation as a decision review: identify requirements, rule out absolutisms and justify with observable signals.",
    "explanation": [
      "The original mock questions should exercise scenarios, not remember phrases. Read the dominant restriction first—SLA, recovery, least privilege, compatibility, or cost—and then compare options. Rules out irreversible, manual responses or responses that eliminate a state without a diagnosis. When two alternatives are technically possible, choose the one that satisfies requirements with less operation and better evidence.",
      "After each attempt, it groups errors by domain and by type of reasoning: confusing mitigation with solution, escalating before diagnosing, ignoring idempotence, or extending permissions. Go back to the modules and reproduce the decision in a lab. The internal 80% only indicates preparation; It is not an official grade nor does it guarantee the exam. Don't use dumps or real questions."
    ],
    "deepDive": {
      "mentalModel": "A Professional drill is resolved as a time-sensitive design review. First, the dominant condition is identified and the domain is classified: modeling, processing, security, observability, testing, deployment or optimization. Options that violate a case word, depend on manual editing, destroy state or use absolutes such as always increase compute are then discarded. The correct answer usually combines a specific capability with evidence: preserve checkpoint, use idempotence, review plan, apply least privilege, or promote an artifact. The position of answers or real questions is not memorized. The blueprint guides coverage; The current documentation resolves nomenclature, such as Declarative Automation Bundles, formerly Asset Bundles in the 2025 guide.",
      "mechanics": [
        "In a first pass, clear decisions are answered and those that require comparing two alternatives are marked. In each question, current state, objective, restriction and requested signal are highlighted. Distractors are eliminated by category: incorrect semantics, incompatible capacity, remedy from another layer or operational excess. In revision, an answer is changed only by being able to name the condition that was misinterpreted. Time is reserved in blocks and is not consumed trying to remember an exact phrase of documentation.",
        "After the simulation, the overall percentage hides gaps. Each error is labeled by domain and type of reasoning: missing concept, reading, terminology or tradeoff. You go back to the official source and write your own rule with a counterexample; Then a variant is answered. 80% is an internal course indicator, not a guaranteed official grade. Self-sufficient preparation requires explaining why three distractors fail and running labs, not just recognizing a familiar option."
      ],
      "concepts": [
        {
          "term": "Dominant constraint",
          "definition": "A scenario condition that rules out further alternatives and must be satisfied before optimizing secondary design preferences.",
          "whyItMatters": "Avoid choosing a generally good practice that violates explicitly required state, security, latency, or compatibility."
        },
        {
          "term": "Layer Distractor",
          "definition": "Option that proposes a valid action for performance, data, resources or demand, but at a different layer than the described cause.",
          "whyItMatters": "Recognizing this prevents scaling compute due to cardinality, changing SQL due to queuing or deleting checkpoint due to schema corruption."
        },
        {
          "term": "reasoned review",
          "definition": "Subsequent analysis that explains the correct option, refutes the remaining ones and links the error with concept and official evidence.",
          "whyItMatters": "Turns the drill into transferable learning and reduces dependence on memorizing patterns or response positions."
        }
      ],
      "workedScenario": {
        "situation": "In a simulation, one question describes five large shuffle tasks among four thousand normal ones; Options offer to duplicate workers, coalesce one, activate autoscaling or treat hot keys with AQE.",
        "reasoning": [
          "Identify the extreme distribution as a dominant signal of skew and locate the cause in data and partitions, not in the average capacity of the cluster.",
          "Discard coalescing because it concentrates work, and scaling or autoscaling because they add slots without dividing the key that determines the critical path.",
          "Choose key diagnosis and treatment compatible with AQE, and then verify in the documentation which joins and adaptive plans support that correction."
        ],
        "outcome": "The answer arises from mechanism and evidence, not from a memorized word; The same method is transferred to new questions of spill, joins, cost or reliability."
      }
    },
    "keyPoints": [
      "Extract requirement and status before reading the options as recipes.",
      "Prefers reversible, managed and observable decisions.",
      "Convert drill errors into mastery-directed practice."
    ],
    "decisions": [
      "Extract requirement and status before reading the options as recipes.",
      "Prefers reversible, managed and observable decisions.",
      "Convert drill errors into mastery-directed practice."
    ],
    "example": {
      "title": "Drill Review Log",
      "note": "Records categories and evidence, not the text of actual certification questions."
    },
    "pitfalls": [
      "Memorize that an option is usually correct because it contains a product word.",
      "Immediately repeat the same attempt until you remember answer positions."
    ],
    "examDecision": "Choose the option that satisfies the constraint with minimal operation and evidence; Avoid absolutes like delete, grant all, or always escalate.",
    "checkpoint": {
      "question": "What review provides more value than immediately repeating the drill?",
      "answer": "Classify the reasoning error, return to the weak domain, and produce practical evidence before the next attempt."
    }
  }
} as unknown as Record<string, EnglishLessonContent>;
