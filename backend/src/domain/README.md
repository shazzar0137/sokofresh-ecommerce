# Domain layer

The heart of the business rules, written without depending on any framework, database or external service.

- `entities/`: things with identity (Order, Product, Customer, Farmer).
- `value-objects/`: values defined by their content (Money in KES, PhoneNumber, DeliveryAddress).
- `enums/`: fixed sets of values (OrderStatus, PaymentStatus).
- `interfaces/`: contracts the outer layers must implement (e.g. a payment gateway).
- `domain-services/`: rules that span several entities (e.g. meal-kit pricing).

The names above are examples to guide future work, not implemented code.
