# Target matching test cases
# Each 'valid' variation should match the SAME node in content
# returned_contents: what gets extracted (including docs/decorators)

- name: basic_function
  file: example.ts
  content: |2
    /**
     * Processes data with validation
     */
    function ProcessData(): void {
      return;
    }
  variations_valid:
    - "ProcessData"
    - "ProcessData("
    - "ProcessData()"
    - "function ProcessData"
    - "function ProcessData(): void {"
  variations_invalid:
    - "processData"      # Case mismatch
    - "Process"          # Substring
    - "function"         # No name
  returned_contents:
    - |
      /**
       * Processes data with validation
       */
      function ProcessData(): void {
        return;
      }

- name: decorated_class
  file: service.ts
  content: |2
    /**
     * User service for authentication
     */
    @Injectable()
    @Singleton()
    export class UserService {
      constructor() {}
    }
  variations_valid:
    - "UserService"
    - "class UserService"
    - "export class UserService"
  variations_invalid:
    - "@Injectable"      # Decorator alone
    - "class"           # No name
  returned_contents:
    - |
      /**
       * User service for authentication
       */
      @Injectable()
      @Singleton()
      export class UserService {
        constructor() {}
      }

- name: overloaded_functions
  file: overloads.ts
  content: |2
    // Math utilities
    export function add(a: number): number { 
      return a; 
    }
    export function add(a: number, b: number): number { 
      return a + b; 
    }
    export function multiply(x: number): number { 
      return x * 2; 
    }
  variations_valid:
    - "add"              # Ambiguous - matches both
    - "function add"     
    - "export function add"
  variations_invalid: []
  returned_contents:    # Returns BOTH matches
    - |
      export function add(a: number): number { 
        return a; 
      }
    - |
      export function add(a: number, b: number): number { 
        return a + b; 
      }

- name: single_match_multiply
  file: overloads.ts  # Same file as above
  content: |2
    // Math utilities
    export function add(a: number): number { 
      return a; 
    }
    export function add(a: number, b: number): number { 
      return a + b; 
    }
    export function multiply(x: number): number { 
      return x * 2; 
    }
  variations_valid:
    - "multiply"
    - "function multiply"
  variations_invalid: []
  returned_contents:
    - |
      export function multiply(x: number): number { 
        return x * 2; 
      }

- name: disambiguated_overload
  file: overloads2.ts
  content: |2
    export function add(a: number): number { 
      return a; 
    }
    export function add(a: number, b: number): number { 
      return a + b; 
    }
  variations_valid:
    - "function add(a: number, b: number)"  # Params disambiguate
    - "add(a: number, b: number)"
    - "export function add(a: number, b: number)"
  variations_invalid:
    - "add(b: number)"  # Wrong param name
  returned_contents:
    - |
      export function add(a: number, b: number): number { 
        return a + b; 
      }

- name: python_decorated
  file: cache.py
  content: |2
    @lru_cache(maxsize=128)
    @timing_decorator
    def expensive_operation(n: int) -> int:
        """Compute expensive result"""
        return sum(i * i for i in range(n))
  variations_valid:
    - "expensive_operation"
    - "def expensive_operation"
    - "def expensive_operation(n: int) -> int:"
  variations_invalid:
    - "def"
    - "@lru_cache"
  returned_contents:
    - |
      @lru_cache(maxsize=128)
      @timing_decorator
      def expensive_operation(n: int) -> int:
          """Compute expensive result"""
          return sum(i * i for i in range(n))

- name: nested_class_method
  file: nested.ts
  content: |2
    class Calculator {
      /**
       * Adds two numbers
       * @param a First number
       * @param b Second number
       */
      public add(a: number, b: number): number {
        return a + b;
      }
      
      private validate(x: number): boolean {
        return x > 0;
      }
    }
  variations_valid:
    - "add"
    - "public add"
    - "add(a: number, b: number)"
  variations_invalid:
    - "public"
    - "number"
  returned_contents:
    - |
      /**
       * Adds two numbers
       * @param a First number
       * @param b Second number
       */
      public add(a: number, b: number): number {
        return a + b;
      }

- name: control_flow
  file: control.py
  content: |2
    # Check sign of number
    if x > 0:
        print("positive")
    elif x < 0:
        print("negative")
    else:
        print("zero")
  variations_valid:
    - "if"
    - "if x"
    - "if x > 0:"
  variations_invalid:
    - "x"
  returned_contents:
    - |
      # Check sign of number
      if x > 0:
          print("positive")
      elif x < 0:
          print("negative")
      else:
          print("zero")

- name: elif_block_target
  file: control2.py
  content: |2
    if x > 0:
        print("positive")
    elif x < 0:
        print("negative")
    else:
        print("zero")
  variations_valid:
    - "elif"
    - "elif x < 0"
    - "elif x < 0:"
  variations_invalid:
    - "x < 0"
  returned_contents:
    - |
      elif x < 0:
          print("negative")

- name: else_block_target
  file: control3.py
  content: |2
    if x > 0:
        print("positive")
    elif x < 0:
        print("negative")
    else:
        print("zero")
  variations_valid:
    - "else"
    - "else:"
  variations_invalid: []
  returned_contents:
    - |
      else:
          print("zero")

- name: ambiguous_if_statements
  file: multiple_ifs.py
  content: |2
    if x > 0:
        print("x positive")
    
    if y > 0:
        print("y positive")
    
    if z > 0:
        print("z positive")
  variations_valid:
    - "if"  # Matches all three
  variations_invalid: []
  returned_contents:  # Returns ALL three matches
    - |
      if x > 0:
          print("x positive")
    - |
      if y > 0:
          print("y positive")
    - |
      if z > 0:
          print("z positive")

- name: specific_if_target
  file: multiple_ifs2.py
  content: |2
    if x > 0:
        print("x positive")
    
    if y > 0:
        print("y positive")
    
    if z > 0:
        print("z positive")
  variations_valid:
    - "if y"
    - "if y > 0"
    - "if y > 0:"
  variations_invalid:
    - "y > 0"  # Missing keyword
  returned_contents:
    - |
      if y > 0:
          print("y positive")