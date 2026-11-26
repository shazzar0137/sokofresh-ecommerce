# Backend modules

One folder per business area: authentication, users, customers, products, categories, inventory, suppliers, farmers, cart, checkout, orders, payments, delivery, notifications, reviews, administration.

Rules:
- A module owns its own data and logic.
- Modules talk to each other through clear interfaces, not by reaching into each other's internals.
- Shared business concepts belong in `../domain/`.
