### **Comprehensive Report: A Custom "Parallel Flow" Node for n8n**

#### **Executive Summary**

The goal is to create a single, powerful n8n node that can execute multiple sub-workflows in parallel, wait for all of them to complete, aggregate their results, and then pass this combined data to the next node in the sequence. This "Parallel Flow" node would abstract away the complex manual patterns (like database polling or convoluted `Wait` loops) currently required.

The core concept is sound and achievable. The node would **not be given multiple webhook triggers**. Instead, it would **dynamically generate its own single, temporary webhook URL** to serve as a "return address." It would start the sub-workflows and provide this return address to each of them. The node would then listen for all the sub-workflows to call back to this address before proceeding. It can be designed to be self-contained, managing its state in memory for the duration of its execution, thus **not requiring an external database.** A configurable timeout is a critical feature for handling failures.

---

#### **I. Core Concept: The "Parallel Flow" Node**

The node acts as a temporary orchestrator for a batch of asynchronous tasks. Its lifecycle within a workflow run can be broken down into four distinct phases: **Dispatch, Listen, Aggregate, and Resume**.

1.  **Dispatch:** Fire off all the specified sub-workflows simultaneously.
2.  **Listen:** Pause and wait for signals (callbacks) from the completed sub-workflows.
3.  **Aggregate:** Collect and store the results from each callback.
4.  **Resume:** Once all results are in (or a timeout is reached), combine the results and allow the main workflow to continue.

#### **II. How It Would Work: A Step-by-Step Execution Flow**

This is the internal logic of the node from the moment it is executed.

1.  **Step 1: Initialization (The "Listen" Phase Starts)**
    *   As soon as the node is executed, it registers a unique, temporary webhook listener with the n8n instance. This URL is specific to this single node within this specific workflow execution (e.g., `https://[your-n8n-url]/webhook-wait/[EXECUTION_ID]/[NODE_NAME]`). This URL is its "return address."
    *   It initializes an internal state object in memory. This object contains:
        *   An empty array to store incoming results: `results: []`.
        *   A counter for expected responses, set to the number of sub-workflows to be run: `expectedCount: 5`.
        *   A counter for received responses: `receivedCount: 0`.

2.  **Step 2: Triggering Sub-Workflows (The "Dispatch" Phase)**
    *   The node reads its configuration to get the list of sub-workflows to run.
    *   It iterates through this list and, for each sub-workflow, it uses n8n's internal API to start it asynchronously ("fire-and-forget").
    *   Crucially, it passes the dynamically generated "return address" URL and any other specified input data to each sub-workflow.

3.  **Step 3: The Waiting Game (The "Aggregate" Phase)**
    *   After dispatching all sub-workflows, the node's main execution path pauses. It is now only listening for incoming HTTP requests at its return address.
    *   When a sub-workflow completes and calls the return address URL with its result data:
        *   The node's webhook listener is triggered.
        *   It appends the data from the request body to its internal `results` array.
        *   It increments the `receivedCount`.
        *   It compares `receivedCount` to `expectedCount`.

4.  **Step 4: Timeout Mechanism**
    *   Simultaneously with Step 1, the node starts a timer based on its configured timeout value (e.g., 300 seconds).
    *   The node is effectively in a "race." It will proceed based on whichever of these two events happens first:
        *   The `receivedCount` equals the `expectedCount`.
        *   The timeout timer expires.

5.  **Step 5: Completion & Output (The "Resume" Phase)**
    *   **On Success:** If all callbacks are received, the node de-registers its temporary webhook to clean up resources. It then takes the `results` array, structures it as a standard n8n data array, and passes it as its output. The main workflow execution resumes.
    *   **On Timeout:** If the timer expires before all results are in, the node can be configured to behave in several ways:
        *   **Fail the workflow:** This is the safest default.
        *   **Proceed with partial data:** Pass the results it *did* receive to the next node, potentially with an additional `error` field in the output indicating a timeout occurred.

#### **III. User Experience & Node Configuration**

In the n8n UI, the node's properties panel would be clear and intuitive:

*   **Sub-Workflows (List):** A primary list where a user can add multiple sub-workflows. Each entry would have:
    *   `Workflow ID` or `Workflow URL`: To identify the sub-workflow to run.
    *   `Input Data (JSON)`: A field allowing the user to map data for that specific sub-workflow, using n8n expressions.
*   **Settings (Tab):**
    *   `Timeout (Seconds)`: A numeric field for the maximum wait time. A value of `0` could mean wait forever.
    *   `On Timeout (Dropdown)`: An option to select the behavior on timeout ("Fail Workflow" or "Proceed with Partial Data").
    *   `Batch Size (Optional)`: An advanced setting to run, for example, only 5 sub-workflows in parallel at a time from a list of 100 to avoid overwhelming the system.

#### **IV. Why a Database is Not Necessary (Self-Contained Execution)**

Your intuition is correct. The node does not need an external database because **the state is temporary and only relevant to a single, active workflow execution.**

*   **State Management:** The "state" (the results array, the counters) is held in the memory of the n8n worker process that is handling that specific workflow execution. This state is tied directly to the execution context of the "Parallel Flow" node.
*   **Volatility Trade-off:** The major downside of this in-memory approach is volatility. If the n8n instance or the specific worker process crashes *while the node is waiting*, that state is lost, and the workflow will fail to resume. For many use cases, this is an acceptable risk. An external database provides persistence to survive such crashes, but at the cost of significant external setup and complexity.
*   **Conclusion:** For a self-contained node, managing state in memory is the standard and correct approach.

#### **V. Sub-Workflow Requirements**

To work with this custom node, the sub-workflows must follow a simple, standardized contract:

1.  **Trigger:** They must start with a **standard Webhook Trigger**.
2.  **Input:** They must be designed to accept the `callbackUrl` in the input data sent by the parent node.
3.  **Output:** Their final step must be an **HTTP Request node** configured to `POST` the final result data back to the `callbackUrl` it received.

This design makes the sub-workflows decoupled and independently testable.
