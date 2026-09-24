const leadService = require('../services/leadService');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Controller: Create a customer lead enquiry
 * POST /api/leads
 */
const createLead = async (req, res, next) => {
  try {
    const { name, email, phone, showroom, bike, variant, source, message } = req.body;

    const lead = await leadService.createLead({
      userId: req.user.id,
      name,
      email,
      phone,
      showroomId: showroom,
      bikeId: bike,
      variantId: variant,
      source,
      message
    });

    return res.status(201).json({
      success: true,
      message: 'Lead enquiry created successfully',
      data: {
        lead
      },
      lead
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Retrieve authenticated customer's own leads
 * GET /api/leads/my
 */
const getMyLeads = async (req, res, next) => {
  try {
    const { page, limit } = req.query;

    const result = await leadService.getUserLeads({
      userId: req.user.id,
      page,
      limit
    });

    return sendSuccess(res, 'User leads retrieved successfully', result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLead,
  getMyLeads
};
