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

    testFactory(
        "LINEAR" as any,
        "int fibonacci(int n)",
        "if(n<=1) return n; return fibonacci(n-1) + fibonacci(n-2);"
    );

    testFactory(
        "LINEAR" as any,
        "long long factorial(int n)",
        "long long res=1; for(int i=1; i<=n; i++) res*=i; return res;"
    );

    testFactory(
        "LINEAR" as any,
        "bool isPrime(int n)",
        "if(n<2) return false; for(int i=2; i*i<=n; i++) if(n%i==0) return false; return true;"
    );

    testFactory(
        "SCALAR" as any,
        "int calculateSum(int a, int b, int c)",
        "return a + b + c;"
    );

    testFactory(
        "SCALAR" as any,
        "unsigned int getAbs(long long value)",
        "return value < 0 ? -value : value;"
    );

    testFactory(
        "SCALAR" as any,
        "double circleArea(double radius)",
        "return 3.14159 * radius * radius;"
    );

    testFactory(
        "SCALAR" as any,
        "bool isLongWord(string s)",
        "return s.length() > 10;"
    );

    testFactory(
        "LINEAR" as any,
        "double findAverage(vector<double> grades)",
        "double sum=0; for(double g : grades) sum+=g; return sum/grades.size();"
    );

    testFactory(
        "GRID" as any,
        "int sumMatrix(vector<vector<int>> grid)",
        "int s=0; for(auto r:grid) for(int x:r) s+=x; return s;"
    );

    testFactory(
        "SCALAR" as any,
        "void updateScores(int &current, int bonus)",
        "current += bonus;"
    );

    testFactory(
        "LINEAR" as any,
        "string longestWord(vector<string> words)",
        "string best=''; for(string s:words) if(s.length()>best.length()) best=s; return best;"
    );

    testFactory(
        "LINEAR" as any,
        "int countOccurrences(const vector<int>& arr, int target)",
        "int c=0; for(int x:arr) if(x==target) c++; return c;"
    );

    testFactory(
        "SCALAR" as any,
        "unsigned long long computePower(int base, int exp)",
        "return (unsigned long long)pow(base, exp);"
    );

    testFactory(
        "SCALAR",
        "void swap(int &a, int &b)",
        "int t=a; a=b; b=t;"
    );

    testFactory(
        "SCALAR",
        "unsigned long long getFactorial(int n)",
        "unsigned long long res=1; for(int i=1;i<=n;i++) res*=i; return res;"
    );

    testFactory(
        "SCALAR",
        "double solveQuadratic(double a, double b, double c)",
        "return (-b + sqrt(b*b - 4*a*c)) / (2*a);"
    );

    testFactory(
        "SCALAR",
        "string repeatText(string s, int times)",
        "string r=\"\"; while(times--) r+=s; return r;"
    );

    testFactory(
        "SCALAR",
        "bool isPythagorean(int a, int b, int c)",
        "return (a*a + b*b == c*c);"
    );

    testFactory(
        "LINEAR",
        "int findTarget(vector<int> nums, int target)",
        "for(int i=0;i<nums.size();i++) if(nums[i]==target) return i; return -1;"
    );

    testFactory(
        "LINEAR",
        "bool isSorted(const vector<double>& arr)",
        "for(int i=1;i<arr.size();i++) if(arr[i]<arr[i-1]) return false; return true;"
    );

    testFactory(
        "LINEAR",
        "void multiplyAll(vector<int>& v, int factor)",
        "for(int &x : v) x *= factor;"
    );

    testFactory(
        "LINEAR",
        "string findLongest(vector<string> words)",
        "string l=\"\"; for(auto s:words) if(s.size()>l.size()) l=s; return l;"
    );

    testFactory(
        "LINEAR",
        "int getKth(vector<int> v, int k)",
        "sort(v.begin(), v.end()); return v[k-1];"
    );

    testFactory(
        "GRID",
        "long long sumGrid(vector<vector<int>> g)",
        "long long s=0; for(auto r:g) for(int x:r) s+=x; return s;"
    );

    testFactory(
        "GRID",
        "int getValue(vector<vector<int>> m, int r, int c)",
        "return m[r][c];"
    );

    testFactory(
        "GRID",
        "int sumSub(vector<vector<int>> g, int r1, int c1, int r2, int c2)",
        "int s=0; for(int i=r1;i<=r2;i++) for(int j=c1;j<=c2;j++) s+=g[i][j]; return s;"
    );

    testFactory(
        "GRID",
        "int countTrues(vector<vector<bool>> g)",
        "int c=0; for(auto r:g) for(bool x:r) if(x) c++; return c;"
    );

    testFactory(
        "GRID",
        "double avgGrid(vector<vector<double>> g)",
        "double s=0; int c=0; for(auto r:g) for(auto x:r) {s+=x; c++;} return s/c;"
    );

    testFactory(
        "GRID",
        "unsigned int complexOp(const vector<vector<int>>& grid, int x, int &y, string label)",
        "y += grid.size(); cout << label; return (unsigned int)x + y;"
    );

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

    testFactory(
        "LINKED_LIST",
        "void incrementList(ListNode* head)",
        "while(head) { head->val += 1; head = head->next; }"
    );

    testFactory(
        "LINKED_LIST",
        "int findMax(ListNode* head)",
        "int m = -1e9; while(head) { if(head->val > m) m = head->val; head = head->next; } return m;"
    );

    testFactory(
        "LINKED_LIST",
        "ListNode* removeValue(ListNode* head, int val)",
        "if(!head) return NULL; if(head->val == val) return head->next; return head;"
    );

    testFactory(
        "CUSTOM",
        "N/A",
        `int main() {
            int n; cin >> n;
            cout << "Input squared: " << n*n << endl;
            return 0;
        }`
    );

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

    testFactory(
        "CUSTOM",
        "custom_logic",
        `bool check(int n) { return n > 0; }
         void process() { int n; cin >> n; if(check(n)) cout << "OK"; }
         int main() { process(); return 0; }`
    );

    testFactory(
        "SCALAR",
        "void handleBuffer(int **ptr, size_t size)",
        "*ptr = new int[size];"
    );

    testFactory(
        "SCALAR",
        "std::string getStatus(bool flag)",
        "return flag ? \"Active\" : \"Inactive\";"
    );

    testFactory(
        "SCALAR",
        "int getVersion()",
        "return 101;"
    );
}

runTests();