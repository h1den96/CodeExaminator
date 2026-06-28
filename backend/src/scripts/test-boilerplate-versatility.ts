import { BoilerplateFactory, QuestionCategory } from "../services/boilerplateFactory";

function testFactory(category: QuestionCategory, signature: string, studentCode: string) {
    console.log(`\nTesting Category: ${category} | Signature: ${signature}`);
    console.log(`----------------------------------------------------------`);
    
    try {
        const fullCode = BoilerplateFactory.createFullHarness(category, signature);
        const finalSource = fullCode.replace("// {{STUDENT_CODE}}", studentCode);
        
        console.log("✅ Generated Code Preview (First 15 lines):");
        console.log(finalSource.split('\n').slice(0, 15).join('\n'));
        console.log("\n... [Code Merged Successfully] ...");
        
        // Έλεγχος αν υπάρχουν τα βασικά στοιχεία
        if (finalSource.includes("int main") && finalSource.includes(studentCode)) {
            console.log("🟢 PASS: Harness contains main() and student code.");
        } else {
            console.log("🔴 FAIL: Harness is missing critical components.");
        }
    } catch (error) {
        console.error("🔴 FACTORY ERROR:", error);
    }
}

async function runTests() {
    // Τεστ 1: Fibonacci (Το κλασικό)
   // Τεστ 1: Fibonacci
    testFactory(
        "LINEAR" as any, 
        "int fibonacci(int n)", 
        "if(n<=1) return n; return fibonacci(n-1) + fibonacci(n-2);"
    );

    // Τεστ 2: Factorial
    testFactory(
        "LINEAR" as any, 
        "long long factorial(int n)", 
        "long long res=1; for(int i=1; i<=n; i++) res*=i; return res;"
    );

    // Τεστ 3: Prime Number Check
    testFactory(
        "LINEAR" as any, 
        "bool isPrime(int n)", 
        "if(n<2) return false; for(int i=2; i*i<=n; i++) if(n%i==0) return false; return true;"
    );
    
    // 1. Πολλαπλές Παράμετροι (Θα δείξει αν η main σου μπορεί να διαβάσει >1 ορίσματα)
    testFactory(
        "SCALAR" as any, 
        "int calculateSum(int a, int b, int c)", 
        "return a + b + c;"
    );

    // 2. Τύποι με κενά και περίεργα Return Types (Stress test στο Regex)
    testFactory(
        "SCALAR" as any, 
        "unsigned int getAbs(long long value)", 
        "return value < 0 ? -value : value;"
    );

    // 3. Floating Point Accuracy (Θα δείξει αν η main σου "κλέβει" δεκαδικά μετατρέποντάς τα σε int)
    testFactory(
        "SCALAR" as any, 
        "double circleArea(double radius)", 
        "return 3.14159 * radius * radius;"
    );

    // 4. String Handling (Πολύ πιθανό να κρασάρει αν η main περιμένει αριθμό)
    testFactory(
        "SCALAR" as any, 
        "bool isLongWord(string s)", 
        "return s.length() > 10;"
    );

    // 5. Linear με διαφορετικό τύπο (Θα δείξει αν το vector<int> είναι "καρφωτό" στο LINEAR)
    testFactory(
        "LINEAR" as any, 
        "double findAverage(vector<double> grades)", 
        "double sum=0; for(double g : grades) sum+=g; return sum/grades.size();"
    );

    // 6. Grid/Matrix Test (Το "ιερό δισκοπότηρο" των bugs)
    testFactory(
        "GRID" as any, 
        "int sumMatrix(vector<vector<int>> grid)", 
        "int s=0; for(auto r:grid) for(int x:r) s+=x; return s;"
    );

    // 7. Pass by Reference (Check for symbols parsing)
    testFactory(
        "SCALAR" as any, 
        "void updateScores(int &current, int bonus)", 
        "current += bonus;"
    );

    // 8. Vector of Strings
    testFactory(
        "LINEAR" as any, 
        "string longestWord(vector<string> words)", 
        "string best=''; for(string s:words) if(s.length()>best.length()) best=s; return best;"
    );

    // 9. Const References (Πολύ συνηθισμένο σε Competitive Programming)
    testFactory(
        "LINEAR" as any, 
        "int countOccurrences(const vector<int>& arr, int target)", 
        "int c=0; for(int x:arr) if(x==target) c++; return c;"
    );

    // 10. Complex Return Types (π.χ. unsigned long long με κενά)
    testFactory(
        "SCALAR" as any, 
        "unsigned long long computePower(int base, int exp)", 
        "return (unsigned long long)pow(base, exp);"
    );

    // === 1. SCALAR TESTS (Basic Types, References, Void) ===
    
    // Τεστ 1: Void return με References (Swap)
    testFactory(
        "SCALAR", 
        "void swap(int &a, int &b)", 
        "int t=a; a=b; b=t;"
    );

    // Τεστ 2: Τύποι με πολλά κενά (Unsigned Long Long)
    testFactory(
        "SCALAR", 
        "unsigned long long getFactorial(int n)", 
        "unsigned long long res=1; for(int i=1;i<=n;i++) res*=i; return res;"
    );

    // Τεστ 3: Floating Point Precision
    testFactory(
        "SCALAR", 
        "double solveQuadratic(double a, double b, double c)", 
        "return (-b + sqrt(b*b - 4*a*c)) / (2*a);"
    );

    // Τεστ 4: String & Int Mixed
    testFactory(
        "SCALAR", 
        "string repeatText(string s, int times)", 
        "string r=\"\"; while(times--) r+=s; return r;"
    );

    // Τεστ 5: Boolean Logic
    testFactory(
        "SCALAR", 
        "bool isPythagorean(int a, int b, int c)", 
        "return (a*a + b*b == c*c);"
    );

    // === 2. LINEAR TESTS (Vectors + Extra Parameters) ===

    // Τεστ 6: Vector + Scalar (Search)
    testFactory(
        "LINEAR", 
        "int findTarget(vector<int> nums, int target)", 
        "for(int i=0;i<nums.size();i++) if(nums[i]==target) return i; return -1;"
    );

    // Τεστ 7: Const Reference (Check if parser strips const/& for main)
    testFactory(
        "LINEAR", 
        "bool isSorted(const vector<double>& arr)", 
        "for(int i=1;i<arr.size();i++) if(arr[i]<arr[i-1]) return false; return true;"
    );

    // Τεστ 8: In-place Modification (Void Vector)
    testFactory(
        "LINEAR", 
        "void multiplyAll(vector<int>& v, int factor)", 
        "for(int &x : v) x *= factor;"
    );

    // Τεστ 9: Vector of Strings
    testFactory(
        "LINEAR", 
        "string findLongest(vector<string> words)", 
        "string l=\"\"; for(auto s:words) if(s.size()>l.size()) l=s; return l;"
    );

    // Τεστ 10: Sorting inside function (K-th element)
    testFactory(
        "LINEAR", 
        "int getKth(vector<int> v, int k)", 
        "sort(v.begin(), v.end()); return v[k-1];"
    );

    // === 3. GRID TESTS (2D Vectors + Complex Params) ===

    // Τεστ 11: Basic Grid Sum
    testFactory(
        "GRID", 
        "long long sumGrid(vector<vector<int>> g)", 
        "long long s=0; for(auto r:g) for(int x:r) s+=x; return s;"
    );

    // Τεστ 12: Matrix Access με Indices
    testFactory(
        "GRID", 
        "int getValue(vector<vector<int>> m, int r, int c)", 
        "return m[r][c];"
    );

    // Τεστ 13: Sub-region Sum (Πολλές έξτρα παράμετροι)
    testFactory(
        "GRID", 
        "int sumSub(vector<vector<int>> g, int r1, int c1, int r2, int c2)", 
        "int s=0; for(int i=r1;i<=r2;i++) for(int j=c1;j<=c2;j++) s+=g[i][j]; return s;"
    );

    // Τεστ 14: Boolean Matrix
    testFactory(
        "GRID", 
        "int countTrues(vector<vector<bool>> g)", 
        "int c=0; for(auto r:g) for(bool x:r) if(x) c++; return c;"
    );

    // Τεστ 15: Double Grid (Precision check)
    testFactory(
        "GRID", 
        "double avgGrid(vector<vector<double>> g)", 
        "double s=0; int c=0; for(auto r:g) for(auto x:r) {s+=x; c++;} return s/c;"
    );

    // === 4. THE ULTIMATE STRESS TEST ===

    // Τεστ 16: Const, Refs, Nested Templates, Mixed Types
    testFactory(
        "GRID", 
        "unsigned int complexOp(const vector<vector<int>>& grid, int x, int &y, string label)", 
        "y += grid.size(); cout << label; return (unsigned int)x + y;"
    );

    // Τεστ 17: Επιστροφή νέας λίστας (Reverse)
    // Στόχος: Έλεγχος αν το "printList(result)" λειτουργεί για ListNode*
    testFactory(
        "LINKED_LIST", 
        "ListNode* reverseList(ListNode* head)", 
        `ListNode* prev = NULL; 
         ListNode* curr = head; 
         while(curr) { 
            ListNode* next = curr->next; 
            curr->next = prev; 
            prev = curr; 
            curr = next; 
         } 
         return prev;`
    );

    // Τεστ 18: In-place τροποποίηση (Void)
    // Στόχος: Έλεγχος αν το "printList(head)" λειτουργεί όταν η συνάρτηση είναι void
    testFactory(
        "LINKED_LIST", 
        "void incrementList(ListNode* head)", 
        "while(head) { head->val += 1; head = head->next; }"
    );

    // Τεστ 19: Επιστροφή τιμής (Search)
    // Στόχος: Έλεγχος αν εκτυπώνεται σωστά το int αντί για τη λίστα
    testFactory(
        "LINKED_LIST", 
        "int findMax(ListNode* head)", 
        "int m = -1e9; while(head) { if(head->val > m) m = head->val; head = head->next; } return m;"
    );

    // Τεστ 20: Λίστα με επιπλέον παραμέτρους (Delete Node with Value)
    // Στόχος: Έλεγχος αν η main διαβάζει το extra "int val" μετά τη λίστα
    testFactory(
        "LINKED_LIST", 
        "ListNode* removeValue(ListNode* head, int val)", 
        "if(!head) return NULL; if(head->val == val) return head->next; return head;"
    );

    // === 6. CUSTOM CATEGORY TESTS ===
    // Εδώ το harness επιστρέφει ΜΟΝΟ includes. Ο φοιτητής γράφει τα πάντα.

    // Τεστ 21: Full Program (Codeforces Style)
    testFactory(
        "CUSTOM", 
        "N/A", // Στο custom το signature συνήθως αγνοείται ή είναι τυπικό
        `int main() {
            int n; cin >> n;
            cout << "Input squared: " << n*n << endl;
            return 0;
        }`
    );

    // Τεστ 22: Δημιουργία Κλάσης (OOP exercise)
    testFactory(
        "CUSTOM", 
        "class Point", 
        `class Point {
        public:
            int x, y;
            Point(int _x, int _y) : x(_x), y(_y) {}
        };
        int main() {
            Point p(5, 10);
            cout << p.x << "," << p.y << endl;
            return 0;
        }`
    );

    // Τεστ 23: Multiple Functions & Logic
    testFactory(
        "CUSTOM", 
        "custom_logic", 
        `bool check(int n) { return n > 0; }
         void process() { int n; cin >> n; if(check(n)) cout << "OK"; }
         int main() { process(); return 0; }`
    );

    // === 7. STRESS TESTS ΓΙΑ ΤΟΝ PARSER (Περίεργα ονόματα) ===

    // Τεστ 24: Πολλαπλά pointers (Double pointers)
    testFactory(
        "SCALAR", 
        "void handleBuffer(int **ptr, size_t size)", 
        "*ptr = new int[size];"
    );

    // Τεστ 25: Namespaces και Scope (π.χ. std::string)
    testFactory(
        "SCALAR", 
        "std::string getStatus(bool flag)", 
        "return flag ? \"Active\" : \"Inactive\";"
    );

    // Τεστ 26: Empty Params
    testFactory(
        "SCALAR", 
        "int getVersion()", 
        "return 101;"
    );
}

runTests();